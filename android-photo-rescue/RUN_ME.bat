@echo off
REM Android Photo Rescue - double-click launcher for Windows
title Android Photo Rescue
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    python android_photo_rescue.py
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    py android_photo_rescue.py
    goto :eof
)

echo.
echo Python is not installed yet.
echo Please install it from https://python.org
echo IMPORTANT: on the first install screen, tick "Add Python to PATH".
echo Then double-click RUN_ME.bat again.
echo.
pause
