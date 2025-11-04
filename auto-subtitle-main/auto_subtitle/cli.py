import os
import shutil
import ffmpeg
import whisper
import argparse
import warnings
import tempfile
from .utils import filename, str2bool, write_srt, translate_segments, generate_tts_audio, merge_tts_with_video

# Set FFmpeg path for Windows
if os.name == 'nt':
    ffmpeg_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ffmpeg-8.0-full_build', 'bin')
    if os.path.exists(ffmpeg_dir):
        # Add to PATH
        os.environ['PATH'] = ffmpeg_dir + os.pathsep + os.environ.get('PATH', '')
        # Set the executable paths for ffmpeg-python library
        ffmpeg._run.FFMPEG_BIN = os.path.join(ffmpeg_dir, 'ffmpeg.exe')
        ffmpeg._run.FFPROBE_BIN = os.path.join(ffmpeg_dir, 'ffprobe.exe')


def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("video", nargs="+", type=str,
                        help="paths to video files to transcribe")
    parser.add_argument("--model", default="small",
                        choices=whisper.available_models(), help="name of the Whisper model to use")
    parser.add_argument("--output_dir", "-o", type=str,
                        default=".", help="directory to save the outputs")
    parser.add_argument("--output_srt", type=str2bool, default=False,
                        help="whether to output the .srt file along with the video files")
    parser.add_argument("--srt_only", type=str2bool, default=False,
                        help="only generate the .srt file and not create overlayed video")
    parser.add_argument("--verbose", type=str2bool, default=False,
                        help="whether to print out the progress and debug messages")
    parser.add_argument("--target_language", type=str, default=None,
                        help="Desired output subtitle language (ISO 639-1). If unset or same as source, no translation is performed.")
    parser.add_argument("--keep_original", type=str2bool, default=False,
                        help="Keep an additional .srt with the original language when translating.")
    parser.add_argument("--tts_engine", type=str, default="indextts2", choices=["indextts2"],
                        help="Text-to-speech engine to use for audio generation (indexTTS2 only)")
    parser.add_argument("--voice", type=str, default="default",
                        help="Voice model to use for TTS generation")
    parser.add_argument("--replace_audio", type=str2bool, default=True,
                        help="Replace original audio with TTS (True) or overlay TTS on original (False)")
    parser.add_argument("--generate_tts", type=str2bool, default=False,
                        help="Generate TTS audio for translated subtitles")

    parser.add_argument("--task", type=str, default="transcribe", choices=[
                        "transcribe", "translate"], help="whether to perform X->X speech recognition ('transcribe') or X->English translation ('translate')")
    parser.add_argument("--language", type=str, default="auto", choices=["auto","af","am","ar","as","az","ba","be","bg","bn","bo","br","bs","ca","cs","cy","da","de","el","en","es","et","eu","fa","fi","fo","fr","gl","gu","ha","haw","he","hi","hr","ht","hu","hy","id","is","it","ja","jw","ka","kk","km","kn","ko","la","lb","ln","lo","lt","lv","mg","mi","mk","ml","mn","mr","ms","mt","my","ne","nl","nn","no","oc","pa","pl","ps","pt","ro","ru","sa","sd","si","sk","sl","sn","so","sq","sr","su","sv","sw","ta","te","tg","th","tk","tl","tr","tt","uk","ur","uz","vi","yi","yo","zh"], 
    help="What is the origin language of the video? If unset, it is detected automatically.")

    args = parser.parse_args().__dict__
    model_name: str = args.pop("model")
    output_dir: str = args.pop("output_dir")
    output_srt: bool = args.pop("output_srt")
    srt_only: bool = args.pop("srt_only")
    language: str = args.pop("language")
    target_language: str | None = args.pop("target_language")
    keep_original: bool = args.pop("keep_original")
    tts_engine: str = args.pop("tts_engine")
    voice: str = args.pop("voice")
    replace_audio: bool = args.pop("replace_audio")
    generate_tts: bool = args.pop("generate_tts")
    
    os.makedirs(output_dir, exist_ok=True)

    if model_name.endswith(".en"):
        warnings.warn(
            f"{model_name} is an English-only model, forcing English detection.")
        args["language"] = "en"
    # if translate task used and language argument is set, then use it
    elif language != "auto":
        args["language"] = language
        
    model = whisper.load_model(model_name)
    audios = get_audio(args.pop("video"))
    subtitles = get_subtitles(
        audios,
        output_srt or srt_only,
        output_dir,
        lambda audio_path: model.transcribe(audio_path, **args),
        target_language=target_language,
        keep_original=keep_original,
        generate_tts=generate_tts,
        tts_engine=tts_engine,
        voice=voice,
    )

    if srt_only:
        return

    for path, subtitle_data in subtitles.items():
        # Handle both old format (just srt_path) and new format (dict with srt_path and tts_files)
        if isinstance(subtitle_data, dict):
            srt_path = subtitle_data['srt_path']
            tts_files = subtitle_data.get('tts_files', [])
            segments = subtitle_data.get('segments', [])
        else:
            srt_path = subtitle_data
            tts_files = []
            segments = []
        out_path = os.path.join(output_dir, f"{filename(path)}.mp4")

        print(f"Adding subtitles to {filename(path)}...")

        video = ffmpeg.input(path)
        audio = video.audio

        # If SRT is in a temp directory with Windows drive letter, copy to output_dir to avoid filter path parsing issues
        if (os.name == 'nt') and (':' in srt_path):
            safe_local_srt = os.path.join(output_dir, os.path.basename(srt_path))
            try:
                if os.path.abspath(srt_path) != os.path.abspath(safe_local_srt):
                    shutil.copyfile(srt_path, safe_local_srt)
                    srt_path = safe_local_srt
            except Exception as copy_err:
                print(f"Warning: failed to copy SRT locally ({copy_err}); attempting with original path.")

        # Prepare path for subtitles filter: use relative if possible, else forward slashes
        srt_for_filter = (srt_path if os.path.exists(srt_path) else os.path.abspath(srt_path)).replace('\\', '/')
        try:
            ffmpeg.concat(
                video.filter('subtitles', srt_for_filter, force_style="OutlineColour=&H40000000,BorderStyle=3"), audio, v=1, a=1
            ).output(out_path).run(quiet=True, overwrite_output=True)
        except ffmpeg.Error as e:
            print("Subtitle burn-in failed, retrying with verbose output...")
            try:
                ffmpeg.concat(
                    video.filter('subtitles', srt_for_filter, force_style="OutlineColour=&H40000000,BorderStyle=3"), audio, v=1, a=1
                ).output(out_path).run(quiet=False, overwrite_output=True)
            except ffmpeg.Error as e2:
                # Show stderr to help user debug and then continue to next file
                try:
                    err_text = e2.stderr.decode('utf-8', errors='ignore') if hasattr(e2, 'stderr') else str(e2)
                except Exception:
                    err_text = str(e2)
                print("FFmpeg error while adding subtitles:\n" + err_text)
                continue

        # Generate TTS-dubbed version if TTS was generated
        if generate_tts and tts_files and target_language:
            tts_out_path = os.path.join(output_dir, f"{filename(path)}_dubbed.mp4")
            print(f"Creating TTS-dubbed video for {filename(path)}...")
            
            if merge_tts_with_video(path, tts_files, segments, tts_out_path, replace_audio):
                print(f"Saved TTS-dubbed video to {os.path.abspath(tts_out_path)}.")
            else:
                print(f"Failed to create TTS-dubbed video for {filename(path)}")

        print(f"Saved subtitled video to {os.path.abspath(out_path)}.")


def get_audio(paths):
    temp_dir = tempfile.gettempdir()

    audio_paths = {}

    for path in paths:
        print(f"Extracting audio from {filename(path)}...")
        output_path = os.path.join(temp_dir, f"{filename(path)}.wav")

        ffmpeg.input(path).output(
            output_path,
            acodec="pcm_s16le", ac=1, ar="16k"
        ).run(quiet=True, overwrite_output=True)

        audio_paths[path] = output_path

    return audio_paths


def get_subtitles(audio_paths: list, output_srt: bool, output_dir: str, transcribe: callable,
                  target_language: str | None, keep_original: bool, generate_tts: bool = False,
                  tts_engine: str = "gtts", voice: str = "default"):
    subtitles_path = {}

    for path, audio_path in audio_paths.items():
        base_out_dir = output_dir if output_srt else tempfile.gettempdir()
        base_srt_path = os.path.join(base_out_dir, f"{filename(path)}.srt")

        print(
            f"Generating subtitles for {filename(path)}... This might take a while."
        )

        warnings.filterwarnings("ignore")
        result = transcribe(audio_path)
        warnings.filterwarnings("default")

        segments = result["segments"]
        detected_lang = result.get("language")

        final_srt_path = base_srt_path

        tts_files = []
        final_segments = segments

        # Perform translation if requested and language differs
        if target_language and detected_lang and target_language.lower() != detected_lang.lower():
            try:
                translated_segments = translate_segments(segments, detected_lang, target_language)
                final_segments = translated_segments
                
                if keep_original:
                    orig_path = base_srt_path.replace('.srt', f'.{detected_lang}.srt')
                    with open(orig_path, 'w', encoding='utf-8') as orig_f:
                        write_srt(segments, file=orig_f)
                        
                final_srt_path = base_srt_path.replace('.srt', f'.{target_language}.srt')
                with open(final_srt_path, 'w', encoding='utf-8') as translated_f:
                    write_srt(translated_segments, file=translated_f)
                    
                # Generate TTS if requested
                if generate_tts:
                    print(f"Generating TTS audio for {filename(path)}...")
                    tts_files = generate_tts_audio(translated_segments, target_language, voice, output_dir)
                    
            except Exception as e:
                print(f"Translation failed ({e}); falling back to original language subtitles.")
                with open(final_srt_path, 'w', encoding='utf-8') as srt:
                    write_srt(segments, file=srt)
        else:
            with open(final_srt_path, 'w', encoding='utf-8') as srt:
                write_srt(segments, file=srt)

        # Return enhanced data structure for TTS support
        if generate_tts and target_language:
            subtitles_path[path] = {
                'srt_path': final_srt_path,
                'tts_files': tts_files,
                'segments': final_segments
            }
        else:
            subtitles_path[path] = final_srt_path

    return subtitles_path


if __name__ == '__main__':
    main()
