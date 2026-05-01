#!/bin/bash

# Creative Lending Marketplace - Smart Startup Script

echo ""
echo "===================================================================="
echo "       Creative Lending Marketplace - Smart Startup Script"
echo "===================================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js is installed:"
node -v
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed"
    exit 1
fi

# Check MongoDB
echo "Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "[WARNING] MongoDB is not installed locally"
    echo "You can either:"
    echo "  1. Install MongoDB: https://www.mongodb.com/try/download/community"
    echo "  2. Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas"
    echo ""
    USE_ATLAS=1
else
    echo "[OK] MongoDB is installed"
    echo ""
    echo "Starting MongoDB in background..."
    mongod --dbpath ~/mongodb/data &
    sleep 2
    echo "[OK] MongoDB started"
    echo ""
fi

# Setup backend
echo "===================================================================="
echo "STEP 1: Setting up Backend"
echo "===================================================================="
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[OK] .env file created from .env.example"
    else
        echo "[ERROR] .env.example not found"
        exit 1
    fi
fi

echo "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install backend dependencies"
    exit 1
fi
echo "[OK] Backend dependencies installed"
echo ""

# Setup frontend
echo "===================================================================="
echo "STEP 2: Setting up Frontend"
echo "===================================================================="
cd ../frontend

if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[OK] Frontend .env created"
    fi
fi

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install frontend dependencies"
    exit 1
fi
echo "[OK] Frontend dependencies installed"
echo ""

# Start services
echo "===================================================================="
echo "STEP 3: Starting Services"
echo "===================================================================="
echo ""
echo "Starting Backend (port 5000)..."
echo "Starting Frontend (port 3000)..."
echo ""
cd ..

# Start backend in background
cd backend
npm start &
BACKEND_PID=$!
sleep 3

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "===================================================================="
echo "APPLICATION STARTED"
echo "===================================================================="
echo ""
echo "Backend API:  http://localhost:5000/api"
echo "Frontend:     http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
