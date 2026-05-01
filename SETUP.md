# Creative Lending Marketplace - Setup & Run Guide

This guide will walk you through setting up and running the Creative Lending Marketplace application locally.

## Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Either:
  - Local installation: [Download](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
- **npm** or **yarn** (comes with Node.js)

## Quick Start

### 1. Clone/Navigate to Project
```bash
cd c:\Users\Mutale\LendingMarketplace
```

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy the example env file and update it:
```bash
copy .env.example .env
# OR on Mac/Linux:
cp .env.example .env
```

Edit `.env` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/lending-unza
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here_change_this
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note:** If using MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lending-unza
```

### 3. Start MongoDB
If using local MongoDB:
```bash
mongod
# Keep this running in a separate terminal
```

If using MongoDB Atlas, no action needed.

### 4. Start the Backend Server
```bash
npm run dev
```

You should see:
```
MongoDB connected
Server running on port 5000
```

The API will be available at: `http://localhost:5000`

## Frontend Setup

### 1. Open New Terminal & Navigate
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm start
```

The app will automatically open at `http://localhost:3000`

## Testing the Application

### Create Test Users

1. Go to `http://localhost:3000`
2. Click "Sign Up" tab
3. Create test accounts:

**Test Lender:**
- First Name: Chileshe
- Last Name: Mwanza
- Email: lender@unza.zm
- Password: password123
- User Type: Lender Only

**Test Borrower:**
- First Name: Mumbi
- Last Name: Banda
- Email: borrower@unza.zm
- Password: password123
- User Type: Borrower Only

### Navigate the App

After login, you'll see the bottom navigation:
- **Dashboard** (📊) - View loan balance, health ratio, collateral
- **Market** (🏪) - Browse loans to fund or find lenders
- **Loans** (💰) - Manage your loans
- **Messages** (💬) - Chat with lenders/borrowers
- **Profile** (👤) - User profile (coming soon)

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Loans
- `POST /api/loans` - Create loan request
- `GET /api/loans/user/:userId` - Get user's loans
- `PUT /api/loans/:id/accept` - Accept/fund a loan
- `POST /api/loans/:id/payment` - Record payment

### Marketplace
- `GET /api/marketplace/available-loans` - Available loans
- `GET /api/marketplace/available-lenders` - All lenders

### Collateral
- `POST /api/collateral` - Add collateral
- `GET /api/collateral/user/:userId` - Get user's collateral

### Chat
- `GET /api/chat/conversations/:userId` - Get conversations
- `GET /api/chat/messages/:conversationId` - Get messages
- `POST /api/chat/message` - Send message

## Troubleshooting

### MongoDB Connection Issues
**Error:** `MongoDB error: connect ECONNREFUSED`

**Solutions:**
1. Make sure MongoDB is running:
   ```bash
   mongod
   ```
2. Or check MongoDB Atlas connection string in `.env`
3. Verify your IP is whitelisted on Atlas

### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:** Change PORT in `.env`:
```env
PORT=5001
```

### Frontend Won't Connect to Backend
**Error:** `Failed to fetch from http://localhost:5000`

**Solutions:**
1. Ensure backend is running (`npm run dev` in backend folder)
2. Check backend URL in `frontend/src/utils/api.js`
3. Clear browser cache and reload

### Dependencies Issues
**Error:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
npm install --legacy-peer-deps
```

## Project Structure

```
LendingMarketplace/
├── backend/
│   ├── src/
│   │   ├── models/          # Database schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth & validation
│   │   └── index.js         # Server entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── styles/          # CSS files
│   │   ├── utils/           # API client
│   │   ├── App.js           # Main component
│   │   └── index.js         # React entry point
│   ├── public/              # Static files
│   └── package.json
│
├── README.md
└── SETUP.md                 # This file
```

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

Creates optimized production build in `frontend/build/`

### Deploy Backend
Use services like:
- **Heroku**
- **Railway**
- **Render**
- **AWS Elastic Beanstalk**

### Deploy Frontend
Use services like:
- **Vercel**
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**

## Next Steps

1. **Add Authentication Middleware** - Protect API routes with JWT
2. **Implement Payment Processing** - Stripe/Razorpay integration
3. **Add Image Upload** - For collateral photos
4. **Real-time Chat** - Leverage Socket.io fully
5. **Mobile App** - Convert to React Native with Expo
6. **Admin Dashboard** - Loan monitoring and verification
7. **KYC Verification** - Document upload and verification
8. **Automated Credit Scoring** - Credit algorithm implementation

## Support & Help

For issues:
1. Check console logs (browser DevTools or terminal)
2. Verify `.env` file configuration
3. Ensure all services are running (MongoDB, backend, frontend)
4. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Contact

For questions or issues, reach out to: support@lendingmarketplace.com
