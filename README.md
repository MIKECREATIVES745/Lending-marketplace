# Smart Money - Student Lending & Gig Marketplace

A full-stack peer-to-peer lending and gig marketplace for UNZA and Zambian university students. Features include collateral support, integrated chat, **Gig Scout for student jobs**, and **QR code verification for in-person exchanges**.

## ✨ Latest Features

### Gig Scout (New!)
- **Campus Job Board**: Post and search for student gigs (Tutoring, Delivery, Manual Labor).
- **Visual Map Interface**: See where gigs are located around the UNZA campus.
- **Active Campus Zone**: Visual geofencing for on-campus work.
- **Verified Gigs**: Direct application system for student services.

### Dashboard & Analytics
- **Modern UI**: Dark mode support and card-based layout inspired by modern fintech apps.
- **Loan Health**: Real-time tracking of loan balance and health ratios.
- **Quick Gigs**: Fast access to the most recent campus opportunities.

### QR Code Generation & Verification
- **Automatic QR code generation** when lender accepts a loan.
- **Unique verification code** for in-person exchange verification.
- **Scannable QR codes** containing loan details.
- **Audit trail** with timestamps and verification records.

## 🚀 Ready to Deploy

The application is now ready to deploy to production on Render, Heroku, or any platform.

**Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Real-time Notifications (New!)
- **Socket.io Integration**: Get instant alerts for new gig applications, loan approvals, and payments.
- **In-App Banners**: Visual cues for new activity.

### Cloud Storage (New!)
- **Cloudinary Integration**: Safe and scalable storage for collateral images and documents.
- **Production-Ready**: Ready for deployment with remote file storage.

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB for database
- Socket.io for real-time chat
- JWT for authentication
- **QRCode library** for QR generation

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- **QRCode.React** for QR display
- CSS3 with Dark Mode support

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Quick Start

1. **Backend**:
```bash
cd backend
npm install
npm start
```

2. **Frontend**:
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Gigs (Gig Scout)
- `GET /api/gigs` - Get all open gigs
- `POST /api/gigs` - Create a new gig
- `POST /api/gigs/:id/apply` - Apply for a gig
- `GET /api/gigs/my-posts` - Get user's posted gigs

### Loans
- `POST /api/loans` - Create loan request
- `PUT /api/loans/:id/accept` - Accept/fund a loan (auto-generates QR)
- `GET /api/loans/:id/qrcode` - Get QR code for loan
- `POST /api/loans/:id/verify-exchange` - Verify in-person exchange

## License

MIT License

## Support

For support, contact contact@mikecreatives.inc
