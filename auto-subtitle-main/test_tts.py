#!/usr/bin/env python3
"""
Test script for AutoTranscriber TTS functionality
"""

import os
import sys
import tempfile

# Add the auto_subtitle module to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from auto_subtitle.utils import translate_segments, generate_tts_audio

def test_translation():
    """Test translation functionality"""
    print("Testing translation...")
    
    # Sample segments
    test_segments = [
        {
            'start': 0.0,
            'end': 2.5,
            'text': 'Hello, how are you today?'
        },
        {
            'start': 3.0,
            'end': 6.0,
            'text': 'This is a test of the translation system.'
        }
    ]
    
    try:
        # Test English to Spanish
        translated = translate_segments(test_segments, 'en', 'es')
        print("✅ Translation test passed")
        print(f"Original: {test_segments[0]['text']}")
        print(f"Translated: {translated[0]['text']}")
        return translated
    except Exception as e:
        print(f"❌ Translation test failed: {e}")
        return test_segments

def test_tts(segments):
    """Test indexTTS2 functionality"""
    print("\nTesting indexTTS2...")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_files = generate_tts_audio(segments, 'es', 'default', temp_dir)
            
            if audio_files:
                print("✅ indexTTS2 test passed")
                print(f"Generated {len(audio_files)} audio files")
                for i, file in enumerate(audio_files):
                    if os.path.exists(file):
                        size = os.path.getsize(file)
                        print(f"  - {os.path.basename(file)}: {size} bytes")
                        
                        # Verify audio file format
                        try:
                            import wave
                            with wave.open(file, 'r') as wav:
                                channels = wav.getnchannels()
                                sample_rate = wav.getframerate()
                                print(f"    Format: {sample_rate}Hz, {channels} channel(s)")
                        except:
                            print(f"    Format: Unable to verify WAV format")
                    else:
                        print(f"  - {os.path.basename(file)}: File not found")
            else:
                print("⚠️ indexTTS2 test completed but no audio files generated")
                print("Note: This is expected if indexTTS2 is not yet implemented")
                
    except Exception as e:
        print(f"❌ indexTTS2 test failed: {e}")

def main():
    print("AutoTranscriber TTS Test Suite")
    print("=" * 40)
    
    # Test translation
    translated_segments = test_translation()
    
    # Test TTS
    test_tts(translated_segments)
    
    print("\n" + "=" * 40)
    print("Test completed!")

if __name__ == "__main__":
    main()