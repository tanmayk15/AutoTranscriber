"""
Direct test of IndexTTS2 model using uv environment
"""
import subprocess
import os
import sys

# Path to index-tts
index_tts_dir = os.path.join(os.path.dirname(__file__), "..", "index-tts")

print("=== Testing IndexTTS2 Direct ===")
print(f"Index-TTS directory: {index_tts_dir}")

# Create test script
test_script = """
import sys
sys.path.insert(0, '.')
from indextts.infer_v2 import IndexTTS2

print("Initializing IndexTTS2 model...")
model = IndexTTS2(
    cfg_path="checkpoints/config.yaml",
    model_dir="checkpoints",
    use_fp16=False,
    device="cpu"
)

print("Model loaded successfully!")
print("Testing TTS generation...")

# Test simple generation
text = "Hello, this is a test."
output_path = "test_hello.wav"

try:
    # Try to generate audio
    result = model.infer_batch(
        text_list=[text],
        spk_audio=None,  # No reference audio
        save_path=".",
        out_sample_rate=24000,
        stream=False
    )
    print(f"✅ TTS generation successful! Output: {result}")
except Exception as e:
    print(f"❌ TTS generation failed: {e}")
    import traceback
    traceback.print_exc()
"""

# Write script
script_path = os.path.join(index_tts_dir, "test_direct.py")
with open(script_path, "w", encoding="utf-8") as f:
    f.write(test_script)

print(f"Running test script in {index_tts_dir}...")

# Run via uv (no timeout, let it complete)
try:
    result = subprocess.run(
        ["uv", "run", "python", "test_direct.py"],
        cwd=index_tts_dir,
        capture_output=False,  # Show output in real-time
        text=True
    )
    
    print(f"\n✅ Test completed with exit code: {result.returncode}")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
finally:
    # Clean up
    if os.path.exists(script_path):
        os.remove(script_path)
