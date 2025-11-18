@echo off
REM Setup script for WiFi-DensePose on Windows

echo ====================================
echo WiFi-DensePose Setup Script
echo ====================================
echo.

REM Navigate to ML backend directory
cd /d "%~dp0..\backend\ml"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo [1/6] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/6] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [3/6] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [4/6] Installing PyTorch (this may take a while)...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

echo.
echo [5/6] Installing requirements...
pip install -r requirements.txt

echo.
echo [6/6] Installing WiFi-DensePose package...
pip install -e .

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To start the API server, run:
echo   scripts\start_densepose_server.bat
echo.
echo Or manually:
echo   cd backend\ml
echo   venv\Scripts\activate
echo   python -m densepose.api.densepose_api
echo.
pause
