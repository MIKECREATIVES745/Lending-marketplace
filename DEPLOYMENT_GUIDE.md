# Lending Marketplace - Hybrid Deployment Guide



This guide helps deploy the Lending Marketplace using a **hybrid approach**:
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: Use MongoDB Atlas

This gives you fast frontend hosting and a persistent backend for Socket.io chat.

## Features Added Before Deployment

### 1. QR Code Generation & Verification
- When lender and borrower agree on a loan, a unique QR code is automatically generated
- QR code contains loan details and a verification code
- Both parties scan during in-person exchange
- Exchange is recorded and verified in the system
- **New Endpoints:**
  - `GET /api/loans/:id/qrcode` - Get QR code for a loan
  - `POST /api/loans/:id/verify-exchange` - Verify in-person exchange

### 2. Database Fields Added
- `qrCode` - Base64 encoded QR code image
- `verificationCode` - Unique 16-character code
- `exchangeVerified` - Boolean flag
- `verifiedAt` - Timestamp of verification

## Prerequisites for Deployment

1. **GitHub Account** - [Sign up](https://github.com/signup)
2. **Vercel Account** - [Sign up free](https://vercel.com)
3. **Render Account** - [Sign up free](https://render.com)
4. **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/cloud/atlas)
5. **Git installed** - [Download](https://git-scm.com)

## Step-by-Step Deployment

### Phase 1: Prepare Your Code

#### 1.1 Push Code to GitHub

```bash
cd c:\Users\Mutale\LendingMarketplace
git init
git add .
git commit -m "Initial commit with hybrid deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lending-marketplace.git
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

#### 1.2 Confirm Files

Make sure these files exist:
- `render.yaml` - Render backend configuration
- `vercel.json` - Vercel frontend build config
- `frontend/.env` - frontend environment settings
- `frontend/src/utils/api.js` - frontend API client
- `backend/src/index.js` - backend server

### Phase 2: MongoDB Atlas Setup

#### 2.1 Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in or create account
3. Click "Create Project"
4. Name it: `lending-marketplace`
5. Click "Create Project"
6. Create a cluster
7. Select "Free Tier"
8. Choose your region
9. Wait for the cluster to provision

#### 2.2 Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `admin`
4. Password: Generate a secure password and save it
5. Role: "Atlas Admin"
6. Click "Add User"

#### 2.3 Configure Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. Allow access from anywhere for development
4. Confirm the change

#### 2.4 Get Connection String

1. Go to "Clusters"
2. Click "Connect"
3. Select "Drivers"
4. Copy the connection string
5. Replace `<password>` with your password

Example:
```
mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
```

### Phase 3: Deploy Backend to Render

#### 3.1 Create Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "Create +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** `lending-marketplace-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

6. Add environment variables:
```
NODE_ENV = production
PORT = 10000
MONGODB_URI = mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
JWT_SECRET = your-random-secret-key-here
FRONTEND_URL = [will set after Vercel deploy]
```

7. Create the service and wait for deployment
8. Copy the backend URL

### Phase 4: Deploy Frontend to Vercel

#### 4.1 Configure Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect your GitHub repository
4. Set:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

5. Add environment variables:
```
REACT_APP_API_URL = https://your-render-backend-url/api
```

6. Deploy the frontend
7. Copy the Vercel URL

### Phase 5: Finalize Backend Configuration

1. In Render, open your backend service settings
2. Set `FRONTEND_URL` to your Vercel deployment URL
3. Redeploy the backend

### Phase 6: Verify Deployment

- Frontend: `https://your-vercel-url`
- Backend health: `https://your-render-backend-url/api/health`

## Environment Variable Reference

### Render Backend
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here
FRONTEND_URL=https://your-vercel-url
```

### Vercel Frontend
```
REACT_APP_API_URL=https://your-render-backend-url/api
```

## Notes

- Socket.io realtime chat runs on Render backend.
- Vercel serves only the frontend.
- Use MongoDB Atlas for the database.

## Testing QR Code Feature

1. Login as lender
2. Fund a loan
3. View the auto-generated QR code
4. Verify the exchange
