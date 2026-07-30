@echo off
chcp 65001 > nul
echo ===================================
echo     Gem Flipper — PoE Tracker
echo ===================================
echo.

IF NOT EXIST ".venv" (
    echo [1/3] Создание виртуального окружения Python...
    python -m venv .venv
    if errorlevel 1 (
        echo Ошибка: Python не установлен или не добавлен в PATH.
        pause
        exit /b
    )
)

echo [2/3] Активация окружения и установка зависимостей...
call .venv\Scripts\activate
pip install -r requirements.txt

echo [3/3] Запуск сервера...
echo Откройте http://127.0.0.1:8765 в браузере.
echo Нажмите Ctrl+C в этом окне, чтобы остановить сервер.
echo.
python app.py
pause
