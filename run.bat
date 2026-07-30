@echo off
:: Set console encoding to UTF-8
chcp 65001 > nul
cls
echo ===================================
echo     Gem Flipper - PoE Tracker
echo ===================================
echo.

IF NOT EXIST ".venv" (
    echo [1/3] Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo Error: Python is not installed or not added to PATH.
        pause
        exit /b
    )
)

echo [2/3] Activating environment and installing dependencies...
call .venv\Scripts\activate
pip install -r requirements.txt

echo [3/3] Starting server...
echo Open http://127.0.0.1:8765 in your browser.
echo Press Ctrl+C to stop the server.
echo.
python app.py
pause
