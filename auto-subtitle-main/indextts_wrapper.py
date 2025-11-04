"""
Wrapper to call IndexTTS2 from uv environment.
This allows the auto-subtitle project to use IndexTTS2 without requiring all dependencies.
"""

import subprocess
import sys
import os
import json

def generate_tts(text: str, output_path: str, language: str = "en", voice_path: str = None, emotion: str = "happy") -> bool:
    """
    Generate TTS audio using IndexTTS2 via uv environment.
    
    Args:
        text: Text to synthesize
        output_path: Path to save the audio file
        language: Language code (e.g., 'en', 'es', 'zh')
        voice_path: Optional path to reference voice audio
        emotion: Emotion for synthesis (happy, sad, angry, surprise)
    
    Returns:
        True if successful, False otherwise
    """
    # Path to index-tts directory
    index_tts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index-tts")
    
    if not os.path.exists(index_tts_dir):
        print(f"Error: index-tts directory not found at {index_tts_dir}")
        return False
    
    # Create a Python script to run via uv
    script_content = f"""
import sys
sys.path.insert(0, '.')
from indextts.infer_v2 import IndexTTS2
import torch

# Initialize model
model = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=False,  # Set to True if using GPU
    device="cpu"  # or "cuda:0" if GPU available
)

# Generate audio
ref_audio = {repr(voice_path)} if {repr(voice_path)} else None

try:
    # Run TTS inference (correct API: infer, not infer_batch)
    model.infer(
        spk_audio_prompt=ref_audio,
        text={repr(text)},
        output_path={repr(output_path)},
        verbose=False
    )
    
    # Check if file was created
    import os
    if os.path.exists({repr(output_path)}):
        print("SUCCESS")
    else:
        print("ERROR: Output file not created")
        sys.exit(1)
except Exception as e:
    import traceback
    print(f"ERROR: {{e}}")
    traceback.print_exc()
    sys.exit(1)
"""
    
    # Write temporary script
    temp_script = os.path.join(index_tts_dir, "temp_tts_gen.py")
    with open(temp_script, "w", encoding="utf-8") as f:
        f.write(script_content)
    
    try:
        # Run via uv
        result = subprocess.run(
            ["uv", "run", "python", "temp_tts_gen.py"],
            cwd=index_tts_dir,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # Clean up
        if os.path.exists(temp_script):
            os.remove(temp_script)
        
        if "SUCCESS" in result.stdout:
            return True
        else:
            print(f"TTS generation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error running IndexTTS2: {e}")
        if os.path.exists(temp_script):
            os.remove(temp_script)
        return False


if __name__ == "__main__":
    # Test the wrapper
    import argparse
    
    parser = argparse.ArgumentParser(description="IndexTTS2 Wrapper")
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--output", required=True, help="Output audio file path")
    parser.add_argument("--language", default="en", help="Language code")
    parser.add_argument("--voice", default=None, help="Reference voice audio path")
    parser.add_argument("--emotion", default="happy", help="Emotion")
    
    args = parser.parse_args()
    
    success = generate_tts(
        text=args.text,
        output_path=args.output,
        language=args.language,
        voice_path=args.voice,
        emotion=args.emotion
    )
    
    sys.exit(0 if success else 1)
