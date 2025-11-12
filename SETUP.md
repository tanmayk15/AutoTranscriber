# 🚀 AutoTranscriber - Complete Setup Guide

This guide will walk you through setting up **AutoTranscriber** on your local machine after cloning the repository.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- ✅ **Python** 3.11 or higher ([Download](https://www.python.org/downloads/))
- ✅ **Git** ([Download](https://git-scm.com/downloads))
- ✅ **10GB+ free disk space** (for AI models and dependencies)
- ✅ **8GB+ RAM** recommended

### Verify Installations

```bash
node --version   # Should be v18.0.0 or higher
python --version # Should be 3.11.0 or higher
git --version    # Should be 2.0 or higher
```

---

## 📥 Step 1: Clone the Repository

```bash
git clone https://github.com/tanmayk15/AutoTranscriber.git
cd AutoTranscriber
```

---

## 🎨 Step 2: Frontend Setup

### 2.1 Install Node Dependencies

```bash
cd frontend
npm install
```

This will install **440+ packages** including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Installation time:** 3-5 minutes (depending on internet speed)

### 2.2 Create Required Directories

```bash
# Create upload and output directories
mkdir -p public/uploads
mkdir -p public/outputs

# Create placeholder files (optional)
echo "" > public/uploads/.gitkeep
echo "" > public/outputs/.gitkeep
```

### 2.3 Verify Frontend Installation

```bash
npm run dev
```

- Open browser to http://localhost:3000
- You should see the AutoTranscriber interface
- Press `Ctrl+C` to stop the server

---

## 🐍 Step 3: Python Backend Setup

### 3.1 Create Python Virtual Environment (Recommended)

**Windows:**
```powershell
cd ..\auto-subtitle-main
python -m venv venv
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd ../auto-subtitle-main
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Key packages installed:**
- `openai-whisper` - Speech recognition
- `transformers==4.44.2` - Translation models
- `torch==2.1.0` - PyTorch (CPU version)
- `ffmpeg-python` - Video processing
- `numpy==1.26.4` - Numerical computing

**Installation time:** 5-10 minutes

**Note:** The first time you run subtitle generation, Whisper will download the model (~1GB for small model).

### 3.3 Install auto-subtitle Package

```bash
pip install -e .
```

This installs the package in editable mode, allowing you to modify the code.

### 3.4 Test Python Backend

```bash
python -c "import whisper; print('Whisper installed successfully!')"
python -c "from transformers import M2M100ForConditionalGeneration; print('Transformers installed successfully!')"
```

---

## 🎬 Step 4: FFmpeg Setup

FFmpeg is required for audio extraction and subtitle burning.

### Option A: Download Pre-built FFmpeg (Recommended for Windows)

1. **Download FFmpeg 8.0:**
   - Windows: https://github.com/BtbN/FFmpeg-Builds/releases
   - Download `ffmpeg-master-latest-win64-gpl.zip`

2. **Extract to project:**
   ```powershell
   # Extract the downloaded zip
   # Move the folder to: AutoTranscriber/auto-subtitle-main/ffmpeg-8.0-full_build/
   # Ensure structure is: auto-subtitle-main/ffmpeg-8.0-full_build/bin/ffmpeg.exe
   ```

3. **Verify:**
   ```powershell
   cd auto-subtitle-main
   .\ffmpeg-8.0-full_build\bin\ffmpeg.exe -version
   ```

### Option B: System-wide FFmpeg Installation

**Windows (using Chocolatey):**
```powershell
choco install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Verify:**
```bash
ffmpeg -version
```

---

## 🎙️ Step 5: IndexTTS2 Setup (Optional - For Voice Cloning)

Voice cloning is **optional** but provides amazing TTS capabilities.

### 5.1 Navigate to IndexTTS Directory

```bash
cd ../index-tts  # or ..\index-tts on Windows
```

### 5.2 Create Virtual Environment

**Windows:**
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 5.3 Install IndexTTS2

```bash
pip install -e .
```

**Installation time:** 10-15 minutes

### 5.4 Download AI Models

IndexTTS2 models will be downloaded automatically on first use (~8GB total):

Models downloaded to `checkpoints/` directory:
- **MaskGCT** - Semantic codec (~2GB)
- **W2V-BERT 2.0** - Speech encoder (~1GB)
- **BigVGAN v2** - Vocoder (~500MB)
- **CAMPPlus** - Speaker encoder (~200MB)

**First-time TTS generation will take extra time** for model downloads.

---

## 🔧 Step 6: Configuration

### 6.1 Frontend Configuration (Optional)

Create `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Increase timeout for TTS (in seconds)
NEXT_PUBLIC_TTS_TIMEOUT=900
```

### 6.2 Python Path Configuration (Already configured)

The project is already configured to find FFmpeg automatically. No changes needed!

Check `auto-subtitle-main/auto_subtitle/cli.py` (lines 1-18) for Windows FFmpeg path detection.

---

## ✅ Step 7: Verify Complete Installation

### 7.1 Test Full Workflow

1. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser:** http://localhost:3000

3. **Test with a small video:**
   - Upload a short video (30 seconds recommended for testing)
   - Click "Extract Audio"
   - Click "Generate Subtitles"
   - Click "Translate Subtitles" (optional)
   - Click "Burn Subtitles"
   - Click "Generate TTS" (if IndexTTS2 is set up)

### 7.2 Expected Timings (for 30-second video)

| Step | Time (CPU) | Notes |
|------|------------|-------|
| Audio Extraction | 1-2 seconds | Fast |
| Subtitle Generation | 10-20 seconds | First run downloads Whisper model |
| Translation | 30-60 seconds | First run downloads M2M100 model |
| Burn Subtitles | 2-5 seconds | FFmpeg is fast |
| TTS Generation | 2-5 minutes | First run downloads IndexTTS2 models |

---

## 🐛 Common Issues & Solutions

### Issue 1: `npm install` fails

**Error:** `ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
npm install --legacy-peer-deps
```

---

### Issue 2: FFmpeg not found

**Error:** `FileNotFoundError: [WinError 2] The system cannot find the file specified`

**Solution:**
- Ensure FFmpeg is at: `auto-subtitle-main/ffmpeg-8.0-full_build/bin/ffmpeg.exe`
- OR install FFmpeg system-wide and add to PATH
- Restart terminal after installation

---

### Issue 3: Python package conflicts

**Error:** `AttributeError: module 'torch.utils._pytree' has no attribute 'register_pytree_node'`

**Solution:**
```bash
pip uninstall transformers numpy -y
pip install transformers==4.44.2 numpy==1.26.4
```

---

### Issue 4: Whisper model download fails

**Error:** `URLError` or timeout during first subtitle generation

**Solution:**
- Check internet connection
- Manually download model:
  ```bash
  python -c "import whisper; whisper.load_model('small')"
  ```
- Model is cached at: `~/.cache/whisper/` (Linux/Mac) or `%USERPROFILE%\.cache\whisper\` (Windows)

---

### Issue 5: Port 3000 already in use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

### Issue 6: Out of memory during processing

**Error:** `RuntimeError: [enforce fail at alloc_cpu.cpp]`

**Solution:**
- Use smaller Whisper model:
  - Edit `frontend/app/api/generate-subtitles/route.ts`
  - Change `model='small'` to `model='tiny'` or `model='base'`
- Close other applications
- Process shorter videos

---

### Issue 7: IndexTTS2 models not downloading

**Solution:**
```bash
cd index-tts
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows

# Manually trigger download
python -c "from indextts.infer import IndexTTS2Inferencer; IndexTTS2Inferencer()"
```

---

## 📁 Project Structure After Setup

```
AutoTranscriber/
├── frontend/
│   ├── node_modules/          # 440+ npm packages (installed)
│   ├── public/
│   │   ├── uploads/           # User uploaded videos (created)
│   │   └── outputs/           # Generated files (created)
│   ├── app/                   # Next.js app
│   ├── components/            # React components
│   └── package.json
│
├── auto-subtitle-main/
│   ├── venv/                  # Python virtual env (created)
│   ├── ffmpeg-8.0-full_build/ # FFmpeg binaries (downloaded)
│   ├── auto_subtitle/         # Python package
│   ├── requirements.txt
│   └── setup.py
│
├── index-tts/
│   ├── .venv/                 # Python virtual env (created)
│   ├── checkpoints/           # AI models (auto-downloaded)
│   │   ├── maskgct/
│   │   ├── w2v-bert/
│   │   ├── bigvgan/
│   │   └── campplus/
│   └── indextts/              # IndexTTS2 package
│
└── README.md
```

---

## 🎯 Quick Start Commands

After completing the setup, use these commands:

### Start Development Server

```bash
cd frontend
npm run dev
```

### Access Application

Open browser: **http://localhost:3000**

### Test CLI (Optional)

```bash
cd auto-subtitle-main
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# Generate subtitles from command line
auto_subtitle path/to/video.mp4 --model small --task transcribe
```

---

## 💡 Tips for Best Performance

1. **Use GPU (if available):**
   - Install PyTorch with CUDA support
   - Edit requirements.txt: `torch==2.1.0+cu118`
   - 10x faster processing

2. **Optimize Whisper Model:**
   - `tiny` - Fastest, good accuracy (39M params)
   - `base` - Balanced (74M params)
   - `small` - Default, great accuracy (244M params)
   - `medium` - Excellent, slower (769M params)

3. **Close Unnecessary Apps:**
   - AI models are memory-intensive
   - Close browsers, IDEs during processing

4. **Use Shorter Videos for Testing:**
   - Start with 30-60 second clips
   - Verify everything works before long videos

---

## 🔄 Updating the Project

To get latest changes:

```bash
git pull origin main

cd frontend
npm install  # Install new dependencies

cd ../auto-subtitle-main
source venv/bin/activate
pip install -r requirements.txt  # Update Python packages
```

---

## 🆘 Getting Help

If you encounter issues not covered here:

1. **Check GitHub Issues:** https://github.com/tanmayk15/AutoTranscriber/issues
2. **Create New Issue:** Provide error message, OS, Python/Node versions
3. **Documentation:** Read the main [README.md](README.md)

---

## 🎉 You're All Set!

Your AutoTranscriber installation is complete. Start processing videos with AI-powered subtitles, translation, and voice cloning!

### Next Steps:

1. Upload a test video
2. Generate subtitles
3. Translate to your target language
4. Burn subtitles to video
5. Generate voice-cloned audio

**Happy transcribing!** 🚀

---

**Last Updated:** November 2025  
**Author:** Tanmay Khodankar
**Repository:** https://github.com/tanmayk15/AutoTranscriber
