@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  Autonomous Robot Navigation Dashboard - GitHub Push Helper
echo =====================================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH!
    echo.
    echo To install Git, run:
    echo    winget install Git.Git
    echo Or download from: https://git-scm.com/download/win
    echo.
    echo After installing, restart Command Prompt and run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Git found:
git --version
echo.

:: Step 1: Initialize Git repository if needed
if not exist ".git" (
    echo [1/4] Initializing Git repository...
    git init
    git branch -M main
) else (
    echo [1/4] Existing Git repository detected.
)

:: Step 2: Add all files
echo [2/4] Staging files...
git add .

:: Step 3: Commit
echo [3/4] Creating commit...
git commit -m "feat: Autonomous Mobile Robot Navigation System & LiDAR 2D Dashboard with 6-Filter Suite"

:: Step 4: Remote repository
echo.
echo =====================================================================
echo Please enter your GitHub Repository URL.
echo Example: https://github.com/YourUsername/robot-navigation-dashboard.git
echo =====================================================================
set /p REPO_URL="Enter GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL provided. Push cancelled.
    pause
    exit /b 1
)

:: Remove existing origin if any, then add new
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo [4/4] Pushing to GitHub (main branch)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUCCESS] Your repository has been pushed to GitHub successfully!
    echo =====================================================================
) else (
    echo.
    echo [NOTICE] If GitHub requested credentials, ensure you entered your
    echo GitHub Username and Personal Access Token (PAT) as the password.
    echo (GitHub no longer accepts account passwords for command-line push).
)

echo.
pause
