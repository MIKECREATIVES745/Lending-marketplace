cdcd echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if MongoDB is running
echo "Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "${YELLOW}⚠️  MongoDB not found in PATH${NC}"
    echo "Install from: https://www.mongodb.com/try/download/community"
    echo "Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas"
    echo ""
else
    echo "✓ MongoDB found"
fi

echo ""
echo "${GREEN}Installation Steps:${NC}"
echo ""

# Install backend dependencies
echo "1️⃣  Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "2️⃣  Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..
echo "✓ Frontend dependencies installed"
echo ""

echo "${GREEN}Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update backend/.env with your MongoDB connection string"
echo ""
echo "2. Start MongoDB (if using local):"
echo "   mongod"
echo ""
echo "3. Start the backend (in terminal 1):"
echo "   cd backend && npm run dev"
echo ""
echo "4. Start the frontend (in terminal 2):"
echo "   cd frontend && npm start"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more details, see SETUP.md"
echo ""
