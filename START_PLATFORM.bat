@echo off
TITLE Madhurai Chocolate Platform Runner
COLOR 0A

echo ===================================================
echo   Madhurai Chocolate Platform - Standalone Runner
echo ===================================================
echo.
echo Starting Backend API (Port 4000)...
echo Starting Customer Web (Port 3000)...
echo Starting Admin Web (Port 3001)...
echo.
echo NOTE: You can close Antigravity! As long as this window
echo stays open, your websites will remain active.
echo ===================================================
echo.

cd /d "%~dp0"
npm run dev

pause
