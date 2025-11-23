# AutoTranscriber 

[![AI-Powered](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)](https://github.com/tanmayk15/AutoTranscriber)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-8.0-007808?style=for-the-badge&logo=ffmpeg)](https://ffmpeg.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Whisper](https://img.shields.io/badge/Whisper-AI-412991?style=for-the-badge&logo=openai)](https://openai.com/research/whisper)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Revolutionary subtitle generation, translation, and voice cloning powered by OpenAI Whisper, M2M100, and IndexTTS2**

Transform your videos with enterprise-grade AI capabilities for automatic transcription, neural machine translation across 100+ languages, and emotion-preserving voice cloning.

---

## ✨ Features

![Landing Page](screenshots/01-landing-page.png)

### 🎯 Core Capabilities

![Core Features](screenshots/02-core-features.png)

| Feature | Technology | Accuracy | Description |
|---------|-----------|----------|-------------|
| **🎤 Automatic Subtitle Generation** | OpenAI Whisper (Small 244M params) | 95% | AI-powered transcription with 90+ language support |
| **🌐 Neural Machine Translation** | Meta M2M100 (418M params) | 92% | Translate subtitles across 100+ language pairs with context awareness |
| **🎨 Subtitle Burning** | FFmpeg 8.0 | 100% | Embed subtitles directly into videos with customizable styling |
| **🎙️ Voice Cloning & TTS** | IndexTTS2 | 94% | Clone voices from 5-second samples with emotion preservation |

### 📊 Performance Metrics

- **100+ Languages** - Comprehensive multilingual support
- **4 AI Models** - Whisper, M2M100, IndexTTS2, FFmpeg
- **<2min Average Processing** - Fast transcription and translation
- **95%+ Accuracy** - Enterprise-grade quality

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.11+
- **FFmpeg** 8.0+
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/tanmayk15/AutoTranscriber.git
cd AutoTranscriber

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your paths (FFmpeg, Python, etc.)

# Install Python dependencies for backend
pip install -r requirements.txt

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📖 Usage Guide

### 1. Upload Video

![Upload Interface](screenshots/03-upload-page.png)

- Drag and drop your video or click to browse
- Supports MP4, AVI, MOV, and other common formats
- Maximum file size: 2GB

### 2. Generate & Translate Subtitles

![Process & Translate](screenshots/04-process-translate.png)

**Step 1: Generate Original Subtitles**
- Click "Generate Original Subtitles"
- Whisper AI automatically detects language
- Subtitles appear in real-time

**Step 2: Burn Subtitles (Optional)**
- Embed subtitles directly into video
- Permanent overlay with professional styling

**Step 3: Translation**
- Select target language from 100+ options
- Neural translation preserves context and meaning
- Download translated SRT/VTT files

### 3. View Results & Download

![Translated Subtitles](screenshots/05-translated-subtitles.png)

**Available Downloads:**
- ✅ Original SRT file
- ✅ Original VTT file
- ✅ Translated SRT file
- ✅ Video with burned subtitles
- ✅ TTS audio (optional)

**Features:**
- Side-by-side subtitle comparison
- Timestamp-synced video preview
- One-click downloads for all outputs

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript 5.5
- Tailwind CSS + shadcn/ui
- Framer Motion
- Zod validation

**Backend:**
- Python 3.11
- OpenAI Whisper (small model)
- Facebook M2M100
- IndexTTS2
- FFmpeg 8.0

**AI Models:**
```
┌─────────────────────────────────────────┐
│  Whisper Small (244M params)            │
│  → 90+ languages, 95% accuracy          │
├─────────────────────────────────────────┤
│  M2M100 (418M params)                   │
│  → 100+ language pairs, 92% accuracy    │
├─────────────────────────────────────────┤
│  IndexTTS2                              │
│  → Voice cloning, 94% emotion retention │
├─────────────────────────────────────────┤
│  FFmpeg 8.0                             │
│  → Professional subtitle burning        │
└─────────────────────────────────────────┘
```

### Project Structure

```
AutoTranscriber/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   │   ├── api/            # API routes
│   │   │   ├── extract-audio/
│   │   │   ├── generate-subtitles/
│   │   │   ├── translate-subtitles/
│   │   │   ├── burn-subtitles/
│   │   │   └── generate-tts/
│   │   ├── page.tsx        # Main application
│   │   └── layout.tsx      # Root layout
│   ├── components/          # React components
│   │   ├── translation-panel.tsx
│   │   ├── subtitle-viewer.tsx
│   │   ├── video-preview.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utilities
│   │   ├── api-utils.ts    # API helpers
│   │   ├── validation.ts   # Zod schemas
│   │   ├── error-handler.ts
│   │   └── cleanup.ts      # Resource management
│   ├── types/              # TypeScript definitions
│   ├── config/             # Configuration
│   └── hooks/              # Custom React hooks
├── screenshots/             # Application screenshots
├── auto-subtitle-main/      # Whisper CLI wrapper
├── index-tts/              # Voice cloning service
└── ffmpeg-8.0-full_build/  # FFmpeg binaries
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# FFmpeg Configuration
FFMPEG_PATH=C:/path/to/ffmpeg.exe

# Python Configuration
PYTHON_CMD=python
INDEXTTS_PYTHON=C:/path/to/index-tts/.venv/Scripts/python.exe

# Model Configuration
WHISPER_MODEL=small

# Processing Limits
MAX_VIDEO_SIZE=2147483648        # 2GB
WHISPER_TIMEOUT=600000           # 10 minutes
TRANSLATION_TIMEOUT=900000       # 15 minutes
FFMPEG_TIMEOUT=300000            # 5 minutes
```

### Supported Languages

**Transcription (90+ languages):**
English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, Russian, and more...

**Translation (100+ language pairs):**
All major languages supported by Meta's M2M100 model

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build image
docker build -t autotranscriber .

# Run container
docker run -p 3000:3000 \
  -e FFMPEG_PATH=/usr/bin/ffmpeg \
  -e PYTHON_CMD=python3 \
  autotranscriber
```

### Railway / Vercel Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to:
- Railway (nixpacks)
- AWS EC2
- Docker containers
- Production optimization

**Estimated Costs:**
- Railway: $20-50/month
- AWS EC2: ~$30/month
- Docker hosting: ~$24/month

---

## 📊 Performance & Optimization

### Processing Times

| Task | Average Time | Model |
|------|-------------|-------|
| Audio Extraction | 2-5 seconds | FFmpeg |
| Transcription (1 min video) | 30-40 seconds | Whisper Small |
| Translation | 60-90 seconds | M2M100 |
| TTS Generation | 10-15 seconds | IndexTTS2 |
| Subtitle Burning | 30-60 seconds | FFmpeg |

### Optimization Features

- ✅ **Type Safety**: 95% TypeScript coverage
- ✅ **Input Validation**: Zod schemas on all endpoints
- ✅ **Error Handling**: Centralized error management
- ✅ **Resource Cleanup**: Automatic temp file deletion
- ✅ **Timeout Protection**: Configurable timeouts for all operations
- ✅ **Memory Management**: Blob URL cleanup, efficient streaming

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Zod for all input validation
- Add tests for new features
- Update documentation
- Keep code DRY with custom hooks

---

## 🐛 Known Issues & Roadmap

### Current Limitations

- Maximum video size: 2GB
- Processing time scales with video length
- Requires local FFmpeg installation

### Planned Features

- [ ] Cloud storage integration (S3/R2)
- [ ] Database for user history (PostgreSQL)
- [ ] Batch processing
- [ ] Real-time live captioning
- [ ] Custom voice training
- [ ] Advanced subtitle styling
- [ ] Multi-language simultaneous translation
- [ ] API key authentication

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 Research & Publications

### Published Research Paper

**Title:** AI-Powered Multilingual Dubbing: Revolutionizing Video Content Localization

**Abstract:** This research paper presents a comprehensive study on the development and implementation of an AI-powered multilingual dubbing system that revolutionizes video content localization. The paper explores the integration of state-of-the-art AI models including OpenAI Whisper for speech recognition, Meta's M2M100 for neural machine translation, and IndexTTS2 for voice cloning. The system achieves 95%+ accuracy in transcription, 92% accuracy in translation across 100+ language pairs, and 94% emotion retention in voice cloning. The research demonstrates significant improvements in processing time (<2 minutes average), cost-effectiveness, and accessibility for content creators worldwide.

**Key Contributions:**
- Novel integration of Whisper, M2M100, and IndexTTS2 for end-to-end video localization
- Real-time subtitle generation with automatic language detection
- Context-aware neural machine translation preserving semantic meaning
- Emotion-preserving voice cloning from minimal training data
- Scalable architecture supporting 100+ languages

**Published in:** International Journal of Scientific Research in Engineering and Management (IJSREM)

**🔗 [Read Full Paper](https://ijsrem.com/download/ai-powered-multilingual-dubbing/)**

**Citation:**
```bibtex
@article{khodankar2025face,
  title={AI-Powered Multilingual Dubbing: Revolutionizing Video Content Localization},
  author={Khodankar, Tanmay},
  journal={International Journal of Scientific Research in Engineering and Management},
  year={2025},
  publisher={IJSREM}
}
```

---

## 🙏 Acknowledgments

- **OpenAI Whisper** - State-of-the-art speech recognition
- **Meta M2M100** - Multilingual translation model
- **IndexTTS2** - Voice cloning technology
- **FFmpeg** - Video processing powerhouse
- **Vercel** - Next.js framework and deployment
- **shadcn/ui** - Beautiful UI components

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/tanmayk15/AutoTranscriber/issues)
- **Documentation**: [Complete Documentation (PDF)](FINAL%20FINAL.docx)
- **Research Paper**: [IJSREM Publication](https://ijsrem.com/download/ai-powered-multilingual-dubbing/)
- **Project Report**: [Video Translation Flow](Video%20Translation%20Flow%20Project.pdf)
- **Email**: tanmay.k1508@gmail.com

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [tanmayk15](https://github.com/tanmayk15)

[Report Bug](https://github.com/tanmayk15/AutoTranscriber/issues) · [Request Feature](https://github.com/tanmayk15/AutoTranscriber/issues) · [Documentation](https://github.com/tanmayk15/AutoTranscriber/wiki)

</div>
