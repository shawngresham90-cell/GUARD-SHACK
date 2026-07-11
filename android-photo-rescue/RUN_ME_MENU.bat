@echo off
REM Android Rescue - one menu for photos, texts and call logs (Windows)
title Android Rescue - Menu
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    python rescue_menu.py
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    py rescue_menu.py
    goto :eof
)

echo.
echo Python is not installed yet.
echo Please install it from https://python.org
echo IMPORTANT: on the first install screen, tick "Add Python to PATH".
echo Then double-click RUN_ME_MENU.bat again.
echo.
pause
