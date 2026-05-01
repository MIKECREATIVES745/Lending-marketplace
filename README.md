# Creative Lending Marketplace App

A full-stack peer-to-peer lending marketplace for UNZA and Zambian university students with collateral support, integrated chat, and **QR code verification for in-person exchanges**.

## ✨ Latest Features

### QR Code Generation & Verification
- **Automatic QR code generation** when lender accepts a loan
- **Unique verification code** for in-person exchange verification
- **Scannable QR codes** containing loan details
- **Manual code entry** option for accessibility
- **Audit trail** with timestamps and verification records
- Learn more: [QR_CODE_FEATURE.md](QR_CODE_FEATURE.md)

## 🚀 Ready to Deploy

The application is now ready to deploy to production on Render, Heroku, or any platform.

**Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Quick Start (Render):**
1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Follow deployment guide
4. Access from any device worldwide

## Features

- **Dashboard**: Track loan balances, health ratios, collateral values, and interest rates
- **Marketplace**: Browse available loans to fund or find lenders
- **Collateral Management**: Add and manage collateral items for loans
- **Chat Forum**: Real-time messaging between lenders and borrowers
- **Loan Tracking**: Monitor loan status, payments, and terms
- **QR Code Verification**: Secure in-person exchange verification
- **User Profiles**: Verified lenders and borrowers with credit scores
- **KYC Verification**: Know Your Customer compliance

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB for database
- Socket.io for real-time chat
- JWT for authentication
- Bcrypt for password hashing
- **QRCode library** for QR generation

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Socket.io client for real-time chat
- **QRCode.React** for QR display
- CSS3 for styling

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string and JWT secret

5. Start the server:
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm start
```

App runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/lenders/list` - Get all verified lenders

### Loans
- `POST /api/loans` - Create loan request
- `GET /api/loans/user/:userId` - Get user's loans
- `GET /api/loans/:id` - Get loan details
- `PUT /api/loans/:id/accept` - Accept/fund a loan (auto-generates QR)
- `GET /api/loans/:id/qrcode` - Get QR code for loan
- `POST /api/loans/:id/verify-exchange` - Verify in-person exchange
- `POST /api/loans/:id/payment` - Record loan payment

### Marketplace
- `GET /api/marketplace/available-loans` - Get available loans to fund
- `GET /api/marketplace/available-lenders` - Get verified lenders
- `GET /api/marketplace/lenders/:id` - Get lender details

### Collateral
- `POST /api/collateral` - Add collateral item
- `GET /api/collateral/user/:userId` - Get user's collateral
- `PUT /api/collateral/:id` - Update collateral
- `DELETE /api/collateral/:id` - Delete collateral

### Chat
- `GET /api/chat/conversations/:userId` - Get user's conversations
- `GET /api/chat/messages/:conversationId` - Get messages in conversation
- `POST /api/chat/conversation` - Create/get conversation
- `POST /api/chat/message` - Send message

## Project Structure

```
lending-marketplace/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Loan.js
│   │   │   ├── Collateral.js
│   │   │   └── Message.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── loans.js
│   │   │   ├── marketplace.js
│   │   │   ├── collateral.js
│   │   │   └── chat.js
│   │   ├── middleware/
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Marketplace.js
│   │   │   ├── Chat.js
│   │   │   └── BottomNav.js
│   │   ├── styles/
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## In-Person Exchange

While the app facilitates loan matching and communication, actual collateral exchanges happen in person. Users can:
1. Browse available loans in the marketplace
2. Contact lenders through the integrated chat forum
3. Arrange meeting time and location via chat
4. Complete collateral transfer in person
5. Track loan status in the dashboard

## Future Enhancements

- Payment gateway integration
- Automated credit scoring algorithm
- Collateral valuation service
- Document verification system
- Mobile app (React Native)
- Admin panel for moderation
- Loan insurance options
- Dispute resolution system

## License

MIT License

## Support

For support, contact support@lendingmarketplace.com
