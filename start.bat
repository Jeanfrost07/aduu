@echo off
title aduu - Ephemeral Chat
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      🌊 aduu - Ephemeral Chat                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo [1/2] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo.
        echo ❌ Failed to install dependencies
        echo    Make sure Node.js 18+ is installed
        pause
        exit /b 1
    )
    echo.
)

echo [2/2] Starting server...
echo.
echo    Local:   http://localhost:3000
echo    Network: http://YOUR_IP:3000
echo.
echo    Press Ctrl+C to stop
echo.

node server.js

pause