import os
from typing import Iterator, TextIO, List
import tempfile
import subprocess

# Global cache for translation models
_mt_cache = {}

def str2bool(string):
    string = string.lower()
    str2val = {"true": True, "false": False}

    if string in str2val:
        return str2val[string]
    else:
        raise ValueError(
            f"Expected one of {set(str2val.keys())}, got {string}")


def format_timestamp(seconds: float, always_include_hours: bool = False):
    assert seconds >= 0, "non-negative timestamp expected"
    milliseconds = round(seconds * 1000.0)

    hours = milliseconds // 3_600_000
    milliseconds -= hours * 3_600_000

    minutes = milliseconds // 60_000
    milliseconds -= minutes * 60_000

    seconds = milliseconds // 1_000
    milliseconds -= seconds * 1_000

    hours_marker = f"{hours:02d}:" if always_include_hours or hours > 0 else ""
    return f"{hours_marker}{minutes:02d}:{seconds:02d},{milliseconds:03d}"


def write_srt(transcript: Iterator[dict], file: TextIO):
    for i, segment in enumerate(transcript, start=1):
        print(
            f"{i}\n"
            f"{format_timestamp(segment['start'], always_include_hours=True)} --> "
            f"{format_timestamp(segment['end'], always_include_hours=True)}\n"
            f"{segment['text'].strip().replace('-->', '->')}\n",
            file=file,
            flush=True,
        )


def filename(path):
    return os.path.splitext(os.path.basename(path))[0]


def translate_segments(segments: List[dict], src: str, tgt: str) -> List[dict]:
    """
    Translate subtitle segments using HuggingFace M2M100 model.
    Preserves timing and returns new segments with translated text.
    """
    if src.lower() == tgt.lower():
        return segments
    
    try:
        from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
        
        # Use cached model if available
        cache_key = "m2m100"
        if cache_key not in _mt_cache:
            print("Loading M2M100 translation model (this may take a moment)...")
            tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
            model = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")
            _mt_cache[cache_key] = (tokenizer, model)
        
        tokenizer, model = _mt_cache[cache_key]
        
        # Map language codes to M2M100 format
        lang_map = {
            'en': 'en', 'es': 'es', 'fr': 'fr', 'de': 'de', 'it': 'it', 'pt': 'pt',
            'ru': 'ru', 'ja': 'ja', 'ko': 'ko', 'zh': 'zh', 'ar': 'ar', 'hi': 'hi',
            'tr': 'tr', 'pl': 'pl', 'nl': 'nl', 'sv': 'sv', 'da': 'da', 'no': 'no',
            'fi': 'fi', 'cs': 'cs', 'hu': 'hu', 'ro': 'ro', 'bg': 'bg', 'hr': 'hr',
            'sk': 'sk', 'sl': 'sl', 'et': 'et', 'lv': 'lv', 'lt': 'lt', 'mt': 'mt',
            'cy': 'cy', 'ga': 'ga', 'eu': 'eu', 'ca': 'ca', 'gl': 'gl'
        }
        
        src_lang = lang_map.get(src.lower(), 'en')
        tgt_lang = lang_map.get(tgt.lower(), 'en')
        
        translated_segments = []
        batch_size = 8
        
        print(f"Translating subtitles from {src} to {tgt}...")
        
        # Process segments in batches
        for i in range(0, len(segments), batch_size):
            batch_segments = segments[i:i + batch_size]
            texts = [seg['text'].strip() for seg in batch_segments]
            
            # Skip empty texts
            if not any(texts):
                translated_segments.extend(batch_segments)
                continue
            
            # Set source language
            tokenizer.src_lang = src_lang
            
            # Encode and translate
            encoded = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512)
            generated_tokens = model.generate(
                **encoded, 
                forced_bos_token_id=tokenizer.get_lang_id(tgt_lang),
                max_length=512,
                num_beams=5,
                do_sample=False
            )
            
            # Decode translations
            translations = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
            
            # Create new segments with translated text
            for seg, translation in zip(batch_segments, translations):
                new_seg = dict(seg)
                new_seg['text'] = translation.strip() if translation.strip() else seg['text']
                translated_segments.append(new_seg)
        
        return translated_segments
        
    except Exception as e:
        print(f"Translation failed: {e}. Falling back to original text.")
        return segments


def generate_tts_audio(segments: List[dict], target_language: str, voice: str, output_dir: str) -> List[str]:
    """
    Generate TTS audio for translated segments using indexTTS2.
    Returns list of generated audio file paths.
    """
    try:
        # Create TTS segments directory
        tts_dir = os.path.join(output_dir, "tts_segments")
        os.makedirs(tts_dir, exist_ok=True)
        
        audio_files = []
        
        print(f"Generating TTS audio in {target_language} with voice: {voice}")
        
        for i, segment in enumerate(segments):
            text = segment['text'].strip()
            if not text:
                continue
            
            # Generate unique filename for this segment
            audio_file = os.path.join(tts_dir, f"segment_{i:04d}.wav")
            
            # Use indexTTS2
            success = _generate_with_indextts2(text, target_language, voice, audio_file)
            
            if success:
                audio_files.append(audio_file)
            else:
                print(f"Failed to generate TTS for segment {i}: {text[:50]}...")
        
        return audio_files
        
    except Exception as e:
        print(f"TTS generation failed: {e}")
        return []


def _generate_with_indextts2(text: str, language: str, voice: str, output_file: str) -> bool:
    """
    Generate TTS using IndexTTS2 via wrapper
    
    Integrates with the index-tts library for high-quality voice cloning and
    emotionally expressive speech synthesis.
    
    Args:
        text: Text to synthesize
        language: Target language code (e.g., 'en', 'es', 'zh')
        voice: Path to voice reference audio file, or emotion keyword
        output_file: Path where output WAV should be saved
    
    Returns:
        True on success, False on failure
    """
    try:
        # Use the wrapper to call IndexTTS2 from uv environment
        import sys
        wrapper_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "indextts_wrapper.py")
        
        if not os.path.exists(wrapper_path):
            print(f"IndexTTS2 wrapper not found at {wrapper_path}")
            return False
        
        # Get voice reference audio
        voice_path = _get_voice_reference(voice, language)
        
        # Call wrapper
        import subprocess
        result = subprocess.run(
            [sys.executable, wrapper_path, 
             "--text", text,
             "--output", output_file,
             "--language", language,
             "--voice", voice_path if voice_path else "",
             "--emotion", "happy"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # Check if successful
        if result.returncode == 0 and os.path.exists(output_file):
            return True
        else:
            print(f"IndexTTS2 generation failed: {result.stderr}")
            return False
        
    except ImportError as e:
        print(f"IndexTTS2 not installed. Please install from: https://github.com/index-tts/index-tts")
        print(f"Error: {e}")
        return False
    except Exception as e:
        print(f"IndexTTS2 generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def _get_voice_reference(voice: str, language: str) -> str:
    """
    Get or generate voice reference audio for IndexTTS2
    
    Args:
        voice: Voice identifier (can be path to audio file or keyword)
        language: Target language for fallback voice selection
    
    Returns:
        Path to voice reference audio file
    """
    # If voice is a file path, use it directly
    if os.path.exists(voice):
        return voice
    
    # Check for default voice samples in examples directory
    default_voices = {
        'en': 'examples/voice_01.wav',
        'zh': 'examples/voice_07.wav',
        'es': 'examples/voice_10.wav',
        'fr': 'examples/voice_12.wav',
        'default': 'examples/voice_01.wav'
    }
    
    voice_path = default_voices.get(language.lower()[:2], default_voices['default'])
    
    # Check if the voice file exists in checkpoints directory
    if os.path.exists(voice_path):
        return voice_path
    
    # Fallback: use any available example voice
    examples_dir = 'examples'
    if os.path.exists(examples_dir):
        voice_files = [f for f in os.listdir(examples_dir) if f.endswith('.wav')]
        if voice_files:
            return os.path.join(examples_dir, voice_files[0])
    
    # Last resort: create or use a neutral voice
    print(f"Warning: No voice reference found for language '{language}'. Using default.")
    return default_voices['default']


def _create_silent_wav(output_file: str, duration: float = 1.0) -> bool:
    """
    Create a silent WAV file as placeholder (for testing only)
    Remove this function when indexTTS2 is implemented
    """
    try:
        import wave
        import struct
        
        sample_rate = 16000
        channels = 1
        sample_width = 2  # 16-bit
        
        with wave.open(output_file, 'w') as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sample_width)
            wav_file.setframerate(sample_rate)
            
            # Generate silent frames
            frames = int(sample_rate * duration)
            silent_data = struct.pack('<' + 'h' * frames, *([0] * frames))
            wav_file.writeframes(silent_data)
        
        return True
        
    except Exception as e:
        print(f"Failed to create silent WAV: {e}")
        return False


def merge_tts_with_video(video_path: str, tts_files: List[str], segments: List[dict], 
                        output_path: str, replace_audio: bool = True) -> bool:
    """
    Merge generated TTS audio with original video using FFmpeg
    """
    try:
        import ffmpeg
        
        if not tts_files or not segments:
            print("No TTS files to merge")
            return False
        
        # Create a temporary file for the merged audio
        temp_audio = os.path.join(tempfile.gettempdir(), "merged_tts.wav")
        
        # Create silence audio with video duration
        video_info = ffmpeg.probe(video_path)
        duration = float(video_info['streams'][0]['duration'])
        
        # Generate silence as base
        silence = ffmpeg.input('anullsrc=channel_layout=mono:sample_rate=16000', f='lavfi', t=duration)
        
        # Create filter chain to overlay TTS segments
        audio_inputs = [silence]
        filter_chain = []
        
        for i, (tts_file, segment) in enumerate(zip(tts_files, segments)):
            if os.path.exists(tts_file):
                # Load TTS segment
                tts_input = ffmpeg.input(tts_file)
                audio_inputs.append(tts_input)
                
                # Add delay filter for timing
                start_time = segment['start']
                if i == 0:
                    mixed = ffmpeg.filter([audio_inputs[0], tts_input], 'amix', 
                                        inputs=2, duration='longest', dropout_transition=0)
                else:
                    # Apply delay and mix
                    delayed = ffmpeg.filter(tts_input, 'adelay', delays=f'{start_time*1000}')
                    mixed = ffmpeg.filter([mixed, delayed], 'amix', 
                                        inputs=2, duration='longest', dropout_transition=0)
        
        # Export merged audio
        if 'mixed' in locals():
            mixed.output(temp_audio, acodec='pcm_s16le', ac=1, ar=16000).run(overwrite_output=True, quiet=True)
        else:
            return False
        
        # Combine with video
        video = ffmpeg.input(video_path)
        audio = ffmpeg.input(temp_audio)
        
        if replace_audio:
            # Replace original audio
            output = ffmpeg.output(video['v'], audio['a'], output_path, vcodec='copy', acodec='aac')
        else:
            # Mix with original audio (overlay)
            original_audio = video['a']
            mixed_audio = ffmpeg.filter([original_audio, audio['a']], 'amix', inputs=2, duration='longest')
            output = ffmpeg.output(video['v'], mixed_audio, output_path, vcodec='copy', acodec='aac')
        
        output.run(overwrite_output=True, quiet=True)
        
        # Cleanup
        try:
            os.remove(temp_audio)
        except:
            pass
        
        return True
        
    except Exception as e:
        print(f"Audio merging failed: {e}")
        return False
