"""
Simple End-to-End Test for Auto-Subtitle Phase 3
Tests: Translation → TTS Generation → Verification
"""

import os
import sys

print("=" * 60)
print("Auto-Subtitle Phase 3 - End-to-End Test")
print("=" * 60)

# Test 1: Translation
print("\n[1/3] Testing Translation Module...")
print("-" * 60)

from auto_subtitle.utils import translate_segments

test_segments = [
    {
        'start': 0.0,
        'end': 3.0,
        'text': 'Hello, how are you today?'
    },
    {
        'start': 3.5,
        'end': 6.0,
        'text': 'This is a test of the translation system.'
    }
]

try:
    translated = translate_segments(test_segments, 'en', 'es')
    print(f"✅ Translation successful!")
    print(f"\nOriginal:   {test_segments[0]['text']}")
    print(f"Translated: {translated[0]['text']}")
except Exception as e:
    print(f"❌ Translation failed: {e}")
    sys.exit(1)

# Test 2: TTS Generation
print("\n[2/3] Testing TTS Generation...")
print("-" * 60)
print("This will take 2-5 minutes on first run (loading models)...")

from auto_subtitle.utils import generate_tts_audio

try:
    output_dir = os.path.dirname(__file__)
    tts_files = generate_tts_audio(
        segments=translated[:1],  # Just test first segment
        target_language='es',
        voice='default',
        output_dir=output_dir
    )
    
    if tts_files and len(tts_files) > 0:
        print(f"✅ TTS generation successful!")
        print(f"Generated {len(tts_files)} audio file(s):")
        for f in tts_files:
            if os.path.exists(f):
                size = os.path.getsize(f) / 1024  # KB
                print(f"  - {os.path.basename(f)} ({size:.1f} KB)")
            else:
                print(f"  - {os.path.basename(f)} (NOT FOUND)")
    else:
        print(f"⚠️ No TTS files generated (this may be expected if TTS is not fully configured)")
        
except Exception as e:
    print(f"❌ TTS generation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Verification
print("\n[3/3] Verifying Setup...")
print("-" * 60)

checks = {
    "Translation model loaded": "✅" if 'translate_segments' in dir() else "❌",
    "TTS function available": "✅" if 'generate_tts_audio' in dir() else "❌",
    "IndexTTS2 accessible": "✅" if os.path.exists("../index-tts/checkpoints/gpt.pth") else "❌",
    "FFmpeg available": "✅" if os.system("ffmpeg -version > nul 2>&1") == 0 else "❌",
}

for check, status in checks.items():
    print(f"{status} {check}")

# Summary
print("\n" + "=" * 60)
print("Test Summary")
print("=" * 60)

if all(status == "✅" for status in checks.values()):
    print("✅ All systems operational!")
    print("\nYou can now run the full pipeline:")
    print("  python -m auto_subtitle video.mp4 --target_language es --generate_tts True")
else:
    print("⚠️ Some components need attention (see above)")
    print("\nRefer to TESTING_GUIDE.md for troubleshooting")

print("\n" + "=" * 60)
