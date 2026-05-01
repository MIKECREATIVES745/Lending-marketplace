@echo off
REM Lending Marketplace Quick Start Script for Windows

echo.
echo 🚀 Starting Lending Marketplace Setup...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js version:
node --version
echo.

REM Check if MongoDB is installed
where mongod >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  MongoDB not found in PATH
    echo Install from: https://www.mongodb.com/try/download/community
    echo Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
    echo.
) else (
    echo ✓ MongoDB found
    echo.
)

echo.
echo 📦 Installation Steps:
echo.

REM Install backend dependencies
echo 1️⃣  Installing backend dependencies...
cd backend
call npm install --legacy-peer-deps
cd ..
echo ✓ Backend dependencies installed
echo.

REM Install frontend dependencies
echo 2️⃣  Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
cd ..
echo ✓ Frontend dependencies installed
echo.

echo ✅ Setup Complete!
echo.
echo 📝 Next Steps:
echo.
echo 1. Update backend\.env with your MongoDB connection string
echo.
echo 2. Start MongoDB (if using local):
echo    mongod
echo.
echo 3. Start the backend (in command prompt 1):
echo    cd backend ^&^& npm run dev
echo.
echo 4. Start the frontend (in command prompt 2):
echo    cd frontend ^&^& npm start
echo.
echo 5. Open http://localhost:3000 in your browser
echo.
echo 📚 For more details, see SETUP.md
echo.
pause
