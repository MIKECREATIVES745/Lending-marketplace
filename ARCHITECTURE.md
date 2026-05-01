# System Architecture

## Overview Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Frontend                       │
│  React App (Port 3000)                                      │
│  ├── Login/Register Page                                    │
│  ├── Dashboard (Balance, Health Ratio, Collateral)         │
│  ├── Marketplace (Browse Loans/Lenders)                    │
│  ├── Chat (Real-time Messaging)                            │
│  └── Loans (Management & Tracking)                         │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/WebSocket
                  │ Axios + Socket.io Client
                  ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js Express Server                         │
│               (Port 5000)                                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           API Routes & Controllers                      │ │
│  │  ├── /api/auth      (Login, Register)                  │ │
│  │  ├── /api/users     (Profile, Lenders)                 │ │
│  │  ├── /api/loans     (CRUD, Payments)                   │ │
│  │  ├── /api/marketplace (Browse, Filter)                 │ │
│  │  ├── /api/collateral (Manage Items)                    │ │
│  │  └── /api/chat      (Messages, Conversations)          │ │
│  └────────────────────────────────────────────────────────┘ │
│                  │                                           │
│  ┌──────────────┴──────────────┐                            │
│  ▼                             ▼                            │
│ Socket.io                  Middleware                       │
│ (Real-time Chat)          - JWT Auth                        │
│                           - Error Handling                  │
│                           - CORS                            │
└─────────────────┬──────────────────┬───────────────────────┘
                  │                  │
         ┌────────▼─────┐    ┌──────▼───────┐
         ▼              ▼    ▼              ▼
    ┌──────────────────────────────────────────┐
    │         MongoDB Database                 │
    │  (Port 27017)                            │
    │                                          │
    │  Collections:                            │
    │  ├── users (profiles, credentials)      │
    │  ├── loans (requests, contracts)        │
    │  ├── collaterals (items, valuations)    │
    │  ├── messages (chat history)            │
    │  └── conversations (chat groups)        │
    └──────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Registration/Login:
┌──────────────┐    POST /auth/login    ┌──────────────┐
│   Browser    │──────────────────────▶ │  Express API │
│              │                         │              │
│              │ ◀───── JWT Token ────── │              │
└──────────────┘                         └──────┬───────┘
                                                 │
                                                 ▼
                                         ┌──────────────┐
                                         │   MongoDB    │
                                         │   Find User  │
                                         │ Verify Creds │
                                         └──────────────┘

Loan Creation:
┌──────────────┐    POST /api/loans    ┌──────────────┐
│ Borrower App │────────────────────▶  │  Express API │
│              │                        │              │
│              │ ◀─ Loan ID Created ─── │              │
└──────────────┘                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   MongoDB    │
                                        │  Create Loan │
                                        │   Record     │
                                        └──────────────┘

Marketplace Browsing:
┌──────────────┐    GET /marketplace/  ┌──────────────┐
│ Lender App   │    available-loans    │  Express API │
│              │◀──────────────────────│              │
│ [Available   │                        └──────┬───────┘
│  Loans List] │                               │
└──────────────┘                               ▼
                                        ┌──────────────┐
                                        │   MongoDB    │
                                        │ Query Loans  │
                                        │ (with filter)│
                                        └──────────────┘

Real-time Chat:
┌──────────────┐ Socket.io Connection  ┌──────────────┐
│ User 1 App   │◀─────────────────────▶│  Express API │
│              │                        │  Socket.io   │
│ [Chat UI]    │   send-message        │              │
│              │─────────────────────▶  │              │
└──────────────┘                        └──────┬───────┘
                                               │
                    ┌──────────────────────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Broadcast to     │
           │ Other Connected  │
           │ Users in Room    │
           └──────┬───────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Store in DB      │
         │ (Messages &      │
         │ Conversations)   │
         └──────────────────┘
                  │
                  ▼
┌──────────────┐
│ User 2 App   │ ◀── Receive Message (WebSocket)
│ [Chat UI]    │
│ New message! │
└──────────────┘
```

## Authentication Flow

```
1. User enters credentials
            │
            ▼
2. Frontend sends POST /auth/login with email & password
            │
            ▼
3. Express.js receives request
            │
            ▼
4. Middleware checks if valid
            │
            ▼
5. Query MongoDB for user by email
            │
            ▼
6. Compare password with bcrypt.compare()
            │
            ├─ Match ──▶ Create JWT token ──▶ Send to Frontend
            │
            └─ No Match ──▶ Send 401 Unauthorized
            │
            ▼
7. Frontend stores JWT in localStorage
            │
            ▼
8. Subsequent requests include JWT in header:
   Authorization: Bearer <token>
            │
            ▼
9. Middleware (auth.js) verifies JWT
            │
            ├─ Valid ──▶ Process Request
            │
            └─ Invalid ──▶ Send 401 Unauthorized
```

## Component Structure

```
App.js (Main Entry)
│
├── Login Component
│   ├── Registration Form
│   ├── Login Form
│   └── OAuth (Future)
│
├── Navbar Component
│   ├── Logo
│   ├── Notifications
│   └── User Menu
│
├── Main Content (Conditional)
│   ├── Dashboard Component
│   │   ├── Loan Balance Card (Gradient)
│   │   ├── Eligibility Check
│   │   ├── My Loans List
│   │   └── Collateral Management
│   │
│   ├── Marketplace Component
│   │   ├── Tab Switch (Loans/Lenders)
│   │   ├── Filter Controls
│   │   ├── Loans Grid
│   │   └── Lenders Grid
│   │
│   ├── Chat Component
│   │   ├── Conversations Sidebar
│   │   ├── Message Display
│   │   └── Message Input
│   │
│   └── Profile Component (Coming Soon)
│
└── BottomNav Component
    ├── Dashboard Button
    ├── Marketplace Button
    ├── Loans Button
    ├── Messages Button
    └── Profile Button
```

## Database Schema Overview

```
users
├── _id: ObjectId
├── email: String (unique)
├── password: String (hashed)
├── firstName: String
├── lastName: String
├── userType: Enum (borrower, lender, both)
├── creditScore: Number
├── totalBorrowed: Number
├── totalLent: Number
├── verified: Boolean
├── address: Object
└── createdAt: Date

loans
├── _id: ObjectId
├── loanId: String (unique)
├── borrowerId: Reference (User)
├── lenderId: Reference (User)
├── amount: Number
├── interestRate: Number
├── status: Enum (pending, active, completed, defaulted)
├── collateralId: Reference (Collateral)
├── payments: Array
├── healthRatio: Number
├── totalRepaid: Number
└── dates: (created, start, completion)

collaterals
├── _id: ObjectId
├── userId: Reference (User)
├── itemName: String
├── category: String
├── estimatedValue: Number
├── appraiserVerified: Boolean
├── status: Enum (available, pledged, released, forfeited)
├── images: Array
└── documents: Array

messages
├── _id: ObjectId
├── conversationId: Reference (Conversation)
├── senderId: Reference (User)
├── recipientId: Reference (User)
├── message: String
├── status: Enum (sent, delivered, read)
└── createdAt: Date

conversations
├── _id: ObjectId
├── participantIds: Array (References to Users)
├── lastMessage: Reference (Message)
├── lastMessageTime: Date
├── relatedLoanId: Reference (Loan)
└── createdAt: Date
```

## Deployment Architecture (Future)

```
┌────────────────────────────────────────────────────────┐
│                    Internet / CDN                       │
└────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Frontend     │   │ Auth Server  │   │ API Server   │
│ (Vercel/     │   │ (Auth0/      │   │ (Railway/    │
│  Netlify)    │   │  Firebase)   │   │  Render)     │
└──────────────┘   └──────────────┘   └──────────────┘
        │                                      │
        │                                      │
        └──────────────────┬────────────────────┘
                           ▼
                  ┌──────────────────┐
                  │ Load Balancer    │
                  │ (AWS/Nginx)      │
                  └────────┬─────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ API      │   │ API      │   │ API      │
    │ Server 1 │   │ Server 2 │   │ Server 3 │
    │ (Replica)│   │ (Replica)│   │ (Replica)│
    └──────────┘   └──────────┘   └──────────┘
         │              │              │
         └──────────────┬──────────────┘
                        ▼
         ┌──────────────────────────┐
         │ MongoDB Atlas Cluster    │
         │ (3+ nodes for HA)        │
         └──────────────────────────┘
```

---

This architecture is scalable, secure, and follows industry best practices for web applications.
