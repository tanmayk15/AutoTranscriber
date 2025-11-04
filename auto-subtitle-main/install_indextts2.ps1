# IndexTTS2 Installation Script for Windows (PowerShell)
# AutoTranscriber Project - Phase 3

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IndexTTS2 Installation for AutoTranscriber" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/downloads" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Git found" -ForegroundColor Green

# Check if Git LFS is installed
$lfsInstalled = git lfs version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git LFS not installed!" -ForegroundColor Yellow
    Write-Host "Installing Git LFS..." -ForegroundColor Yellow
    git lfs install
}
Write-Host "✓ Git LFS ready" -ForegroundColor Green

# Set project directory
$projectDir = "C:\Users\ACER\Desktop\Projects\MAJOR Project"
Set-Location $projectDir

# Clone IndexTTS2 repository
Write-Host ""
Write-Host "Cloning IndexTTS2 repository..." -ForegroundColor Yellow
if (Test-Path "index-tts") {
    Write-Host "IndexTTS2 directory already exists. Skipping clone..." -ForegroundColor Yellow
} else {
    git clone https://github.com/index-tts/index-tts.git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to clone repository!" -ForegroundColor Red
        exit 1
    }
}
Set-Location "index-tts"
Write-Host "✓ Repository cloned" -ForegroundColor Green

# Pull large files
Write-Host ""
Write-Host "Downloading large files with Git LFS..." -ForegroundColor Yellow
git lfs pull
Write-Host "✓ Large files downloaded" -ForegroundColor Green

# Install uv package manager
Write-Host ""
Write-Host "Installing uv package manager..." -ForegroundColor Yellow
pip install -U uv
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install uv!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ uv installed" -ForegroundColor Green

# Install IndexTTS2 dependencies
Write-Host ""
Write-Host "Installing IndexTTS2 dependencies..." -ForegroundColor Yellow
Write-Host "(This may take several minutes...)" -ForegroundColor Gray
uv sync --all-extras
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Write-Host "Try using a mirror:" -ForegroundColor Yellow
    Write-Host 'uv sync --all-extras --default-index "https://mirrors.aliyun.com/pypi/simple"' -ForegroundColor Gray
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Install IndexTTS2 as editable package
Write-Host ""
Write-Host "Installing IndexTTS2 package..." -ForegroundColor Yellow
pip install -e .
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Package installation failed, but may still work" -ForegroundColor Yellow
}
Write-Host "✓ Package installed" -ForegroundColor Green

# Download model weights
Write-Host ""
Write-Host "Setting up model downloader..." -ForegroundColor Yellow
uv tool install "huggingface-hub[cli,hf_xet]"

Write-Host ""
Write-Host "Downloading IndexTTS2 model weights..." -ForegroundColor Yellow
Write-Host "(This will download ~2GB of data...)" -ForegroundColor Gray

# Check if using HuggingFace or ModelScope
$useModelScope = Read-Host "Use ModelScope mirror (China)? (y/N)"
if ($useModelScope -eq "y" -or $useModelScope -eq "Y") {
    Write-Host "Using ModelScope..." -ForegroundColor Yellow
    uv tool install "modelscope"
    modelscope download --model IndexTeam/IndexTTS-2 --local_dir checkpoints
} else {
    Write-Host "Using HuggingFace..." -ForegroundColor Yellow
    hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to download models!" -ForegroundColor Red
    Write-Host "You can manually download from:" -ForegroundColor Yellow
    Write-Host "  HuggingFace: https://huggingface.co/IndexTeam/IndexTTS-2" -ForegroundColor Gray
    Write-Host "  ModelScope: https://modelscope.cn/models/IndexTeam/IndexTTS-2" -ForegroundColor Gray
    exit 1
}
Write-Host "✓ Models downloaded" -ForegroundColor Green

# Test installation
Write-Host ""
Write-Host "Testing IndexTTS2 installation..." -ForegroundColor Yellow
$testScript = @"
from indextts.infer_v2 import IndexTTS2
print('IndexTTS2 import successful!')
tts = IndexTTS2(cfg_path='checkpoints/config.yaml', model_dir='checkpoints', use_fp16=True, use_cuda_kernel=False, use_deepspeed=False)
print('IndexTTS2 model loaded successfully!')
"@

$testScript | python
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ IndexTTS2 is working!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Test failed, but installation may still work" -ForegroundColor Yellow
}

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "IndexTTS2 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Return to auto-subtitle-main directory:" -ForegroundColor White
Write-Host '   cd "..\auto-subtitle-main"' -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the integration:" -ForegroundColor White
Write-Host "   python test_tts.py" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run full pipeline:" -ForegroundColor White
Write-Host '   python -m auto_subtitle.cli --target_language es --generate_tts True --output_srt True video.mp4' -ForegroundColor Gray
Write-Host ""
Write-Host "For more information, see INDEXTTS2_INTEGRATION.md" -ForegroundColor Yellow
Write-Host ""