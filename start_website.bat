@echo off
title Autonomous Robot SLAM Dashboard Server
echo ========================================================
echo   Autonomous Robot SLAM Navigation Dashboard Server
echo ========================================================
echo.
cd /d "C:\Users\prane\.gemini\antigravity\scratch\robot-navigation-dashboard"
echo Starting web server on http://127.0.0.1:5173/ ...
echo (Keep this window open or minimized while using the website)
echo.
start http://127.0.0.1:5173/
node server.cjs
pause
