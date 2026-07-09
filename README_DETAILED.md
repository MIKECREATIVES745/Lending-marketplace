# Lending Marketplace - Full Stack Application

A comprehensive peer-to-peer lending marketplace where people can lend and borrow money using collateral items as security. The platform includes a built-in chat forum for communication between lenders and borrowers, with all exchanges coordinated in-person.

## 🎯 Key Features

### For Borrowers
- Create loan requests with collateral pledging
- Browse and connect with verified lenders
- Real-time chat with lenders
- Track loan status and payment schedules
- Manage collateral items
- View credit score and eligibility

### For Lenders
- Browse available loans to fund
- View borrower profiles and credit scores
- Fund loans and track repayment
- Real-time communication with borrowers
- Manage portfolio of active loans

### Platform Features
- **Dashboard** - Comprehensive loan overview with health metrics
- **Marketplace** - Filterable loan and lender discovery
- **Chat Forum** - Real-time messaging between parties
- **Collateral Management** - Add, verify, and manage collateral items
- **In-Person Exchanges** - Coordinate meetings to transfer collateral
- **User Verification** - KYC support with document verification

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- npm or yarn

### Installation & Running

See [SETUP.md](./SETUP.md) for detailed setup instructions.

**Quick command:**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

Visit `http://localhost:3000` and sign up to start using the app!

## 📱 User Interface

The app is mobile-first with:
- Clean, intuitive dashboard showing loan balance and metrics
- Bottom navigation for easy access (Dashboard, Market, Loans, Messages, Profile)
- Gradient-styled cards for loan details
- Real-time chat interface
- Collateral management with image upload support

## 🏗️ Architecture

### Backend
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io for chat
- **Auth:** JWT with Bcrypt password hashing
- **API:** RESTful design

### Frontend
- **Framework:** React 18
- **State:** React Hooks
- **HTTP:** Axios
- **Styling:** CSS3 with modern variables
- **Real-time:** Socket.io client

## 📚 API Documentation

### Core Endpoints

**Auth**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

**Loans**
- `POST /api/loans` - Create loan request
- `GET /api/loans/user/:userId` - User's loans
- `PUT /api/loans/:id/accept` - Fund loan
- `POST /api/loans/:id/payment` - Record payment

**Marketplace**
- `GET /api/marketplace/available-loans` - Loans to fund
- `GET /api/marketplace/available-lenders` - All lenders

**Collateral**
- `POST /api/collateral` - Add item
- `GET /api/collateral/user/:userId` - User's items

**Chat**
- `GET /api/chat/conversations/:userId` - Get chats
- `GET /api/chat/messages/:conversationId` - Messages
- `POST /api/chat/message` - Send message

## 📦 Project Structure

```
lending-marketplace/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth & validation
│   │   └── index.js           # Server entry
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── styles/            # CSS files
│   │   ├── utils/             # API client
│   │   └── index.js           # React entry
│   └── package.json
├── README.md
├── SETUP.md                    # Detailed setup guide
└── package.json               # Root scripts
```

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing (10 rounds)
- CORS protection
- Input validation with express-validator
- Environment variable configuration
- Secure headers

## 🎓 Loan Workflow

1. **Borrower** creates loan request with:
   - Loan amount needed
   - Interest rate offer
   - Loan term
   - Collateral items & values

2. **Lender** views request in marketplace and:
   - Reviews borrower's credit score
   - Assesses collateral value
   - Decides to fund or skip

3. **Both parties** use in-app chat to:
   - Discuss terms
   - Arrange meeting
   - Coordinate collateral transfer

4. **In-person exchange:**
   - Verify collateral condition
   - Exchange collateral for funds
   - Create written agreement

5. **Ongoing management:**
   - Track payments in dashboard
   - Monitor health ratio
   - Update status

## 🌟 Unique Features

- **Collateral-based:** Secured loans against physical items
- **In-person exchanges:** Better for local communities
- **Integrated chat:** No need for external communication tools
- **Health metrics:** Track loan health with visual indicators
- **Flexible terms:** Customize interest rates and timeframes

## 🛣️ Roadmap

### Phase 1 (Complete)
- ✅ Core platform architecture
- ✅ User authentication
- ✅ Loan creation & matching
- ✅ Collateral management
- ✅ Chat forum

### Phase 2 (Planned)
- Payment gateway integration
- Automated credit scoring
- Document verification
- Loan insurance options
- Email notifications

### Phase 3 (Future)
- Mobile app (React Native)
- Admin dashboard
- Advanced analytics
- Dispute resolution system
- Video identity verification

## 💻 Development

### Running in Development
```bash
# Backend development
cd backend && npm run dev

# Frontend development
cd frontend && npm start
```

### Building for Production
```bash
cd frontend
npm run build
```

## 📄 Environment Variables

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/lending-marketplace
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

Contributions welcome! Areas to help:
- Bug fixes and improvements
- UI/UX enhancements
- Additional features
- Documentation
- Testing

## 📧 Support

Issues or questions? Check [SETUP.md](./SETUP.md) troubleshooting section or contact support.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

Built with modern web technologies:
- Express.js for backend
- React for frontend
- MongoDB for database
- Socket.io for real-time features

---

**Made with ❤️ by the Lending Marketplace Team**

Start building community-driven financial solutions today!
