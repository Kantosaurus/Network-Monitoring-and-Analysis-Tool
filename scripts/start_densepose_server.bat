@echo off
REM Start the DensePose API server

echo ====================================
echo Starting WiFi-DensePose API Server
echo ====================================
echo.

REM Navigate to ML backend directory
cd /d "%~dp0..\backend\ml"

REM Check if virtual environment exists
if not exist "venv" (
    echo ERROR: Virtual environment not found!
    echo Please run setup_densepose.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo Starting server on http://localhost:5001
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python -m densepose.api.densepose_api --host 0.0.0.0 --port 5001

pause
