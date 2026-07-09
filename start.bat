@echo off
REM Smart Money - Smart Startup Script

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo ====================================================================
echo        Smart Money - Smart Startup Script
echo ====================================================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed: 
node -v
echo.

REM Check if npm is installed
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

REM Check MongoDB
echo Checking MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MongoDB is not installed locally
    echo You can either:
    echo   1. Install MongoDB: https://www.mongodb.com/try/download/community
    echo   2. Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
    echo.
    set "USE_ATLAS=1"
) else (
    echo [OK] MongoDB is installed
    echo.
    echo Starting MongoDB in background...
    start "" mongod --dbpath "%USERPROFILE%\mongodb\data"
    timeout /t 2 /nobreak
    echo [OK] MongoDB started
    echo.
)

REM Setup backend
echo ====================================================================
echo STEP 1: Setting up Backend
echo ====================================================================
cd backend
if not exist ".env" (
    echo Creating .env file...
    if exist ".env.example" (
        copy .env.example .env
        echo [OK] .env file created from .env.example
    ) else (
        echo [ERROR] .env.example not found
        pause
        exit /b 1
    )
)

echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

REM Setup frontend
echo ====================================================================
echo STEP 2: Setting up Frontend
echo ====================================================================
cd ..\frontend
if not exist ".env" (
    echo Creating frontend .env file...
    if exist ".env.example" (
        copy .env.example .env
        echo [OK] Frontend .env created
    )
)

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

REM Start services
echo ====================================================================
echo STEP 3: Starting Services
echo ====================================================================
echo.
echo Starting Backend (port 5000)...
echo Starting Frontend (port 3000)...
echo.
echo Opening browser...
cd ..

REM Start backend in one window
start "Lending Marketplace - Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak

REM Start frontend in another window
start "Lending Marketplace - Frontend" cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak

echo.
echo ====================================================================
echo APPLICATION STARTED
echo ====================================================================
echo.
echo Backend API:  http://localhost:5000/api
echo Frontend:     http://localhost:3000
echo.
echo Press any key when ready to deploy...
pause

echo.
echo ====================================================================
echo DEPLOYMENT OPTIONS
echo ====================================================================
echo.
echo 1. Deploy to Google Cloud Run
echo    See: DEPLOYMENT_GOOGLE_CLOUD.md
echo.
echo 2. Deploy to Render
echo    See: DEPLOYMENT_GUIDE.md
echo.
echo 3. Deploy to Heroku
echo    See: DEPLOYMENT_GUIDE.md
echo.
pause
