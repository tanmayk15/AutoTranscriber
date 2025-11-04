
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
ref_audio = 'examples/voice_01.wav' if 'examples/voice_01.wav' else None

try:
    # Run TTS inference (correct API: infer, not infer_batch)
    model.infer(
        spk_audio_prompt=ref_audio,
        text='I like to stay positive and make the most out of this situation.',
        output_path='.\\tts_segments\\segment_0004.wav',
        verbose=False
    )
    
    # Check if file was created
    import os
    if os.path.exists('.\\tts_segments\\segment_0004.wav'):
        print("SUCCESS")
    else:
        print("ERROR: Output file not created")
        sys.exit(1)
except Exception as e:
    import traceback
    print(f"ERROR: {e}")
    traceback.print_exc()
    sys.exit(1)
