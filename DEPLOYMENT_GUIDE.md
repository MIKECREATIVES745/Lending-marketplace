# Lending Marketplace - Hybrid Deployment Guide

This guide will help you deploy the Lending Marketplace using a **hybrid approach**:
- **Frontend**: Deployed to Vercel (fast, reliable static hosting)
- **Backend**: Deployed to Render (persistent server for real-time features)

This setup gives you the best of both worlds: Vercel's excellent frontend performance and Render's reliable backend with WebSocket support for real-time chat.

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
git commit -m "Initial commit with QR code feature"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lending-marketplace.git
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

#### 1.2 Verify Files

Make sure these new files exist:
- `backend/Procfile` - Server startup configuration
- `frontend/.env` (for build-time variables)
- `render.yaml` - Render deployment configuration
- `backend/src/routes/loans.js` - Updated with QR code endpoints
- `backend/src/models/Loan.js` - Updated with new fields
- `frontend/src/components/QRCode.js` - QR code display component
- `frontend/src/styles/qrcode.css` - QR code styling

### Phase 2: MongoDB Atlas Setup

#### 2.1 Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in or create account
3. Click "Create Project"
4. Give it a name: `lending-marketplace`
5. Click "Create Project"
6. Click "Create" cluster
7. Select "Free Tier"
8. Choose region closest to you
9. Click "Create Cluster" (wait 3-5 minutes)

#### 2.2 Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `admin`
4. Password: Generate secure password (save it!)
5. Role: "Atlas Admin"
6. Click "Add User"

#### 2.3 Configure Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

#### 2.4 Get Connection String

1. Go to "Clusters"
2. Click "Connect"
3. Select "Drivers"
4. Copy the connection string
5. Replace `<password>` with your password
6. Copy this URL - **you'll need it for Render**

Example format:
```
mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
```

### Phase 3: Deploy Backend to Render

#### 3.1 Create Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "Create +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Fill in the form:
   - **Name:** `lending-marketplace-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

6. Click "Advanced" and add environment variables:
   ```
   NODE_ENV = production
   PORT = 10000
   MONGODB_URI = [Your MongoDB connection string]
   JWT_SECRET = [Generate a random secret: use online UUID generator]
   FRONTEND_URL = [Will update after Vercel deployment]
   ```

7. Click "Create Web Service"
8. Wait for deployment (3-5 minutes)
9. Copy the URL: `https://lending-marketplace-api.onrender.com`

### Phase 4: Deploy Frontend to Vercel

#### 4.1 Prepare Frontend Configuration

Create a `vercel.json` file in the root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ]
}
```

#### 4.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect your GitHub repository
4. Configure the project:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

5. Add environment variables:
   ```
   REACT_APP_API_URL = https://lending-marketplace-api.onrender.com/api
   ```

6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Copy the URL: `https://your-project-name.vercel.app`

### Phase 5: Update Backend Configuration

#### 5.1 Update Render Environment Variables

Go back to your Render backend service and update the `FRONTEND_URL`:
```
FRONTEND_URL = https://your-project-name.vercel.app
```

#### 5.2 Redeploy Backend

1. In Render dashboard, go to your backend service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for redeployment

### Phase 6: Verify Deployment

1. Your frontend will be at: `https://your-project-name.vercel.app`
2. Your backend API will be at: `https://lending-marketplace-api.onrender.com/api`
3. Test the health endpoint: `https://lending-marketplace-api.onrender.com/api/health`

## Testing QR Code Feature

### Create a Loan Agreement

1. **Login as Lender:** `lender@test.com` / `password123`
2. Go to **Market** → **Available Loans to Fund**
3. Find a loan and click "Fund This Loan"
4. Once accepted, QR code auto-generates

### View & Download QR Code

1. Go to **Loans** section
2. Find the active loan
3. Click "View QR Code"
4. Download or screenshot the QR code
5. Share code with borrower

### Verify In-Person Exchange

1. When meeting in person, scan QR code or enter verification code
2. Both confirm the exchange
3. Status updates to "Verified"
4. Loan becomes official

## Environment Variables Reference

### Render Backend (.env on Render)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/lending-marketplace
JWT_SECRET=your-random-secret-key-here
FRONTEND_URL=https://your-project-name.vercel.app
```

### Vercel Frontend (Environment Variables)
```
REACT_APP_API_URL=https://lending-marketplace-api.onrender.com/api
```

## Benefits of Hybrid Deployment

✅ **Real-time Chat:** Socket.io works perfectly on Render's persistent servers
✅ **Fast Frontend:** Vercel provides excellent performance for React apps
✅ **Scalability:** Both platforms handle scaling automatically
✅ **Cost Effective:** Free tiers available on both platforms
✅ **Reliability:** Best tools for each component of your stack

## Troubleshooting

### CORS Issues
If you encounter CORS errors, make sure the `FRONTEND_URL` in Render matches your Vercel URL exactly.

### Chat Not Working
Ensure Socket.io connections are going to the Render backend URL, not Vercel.

### Build Failures
Check that all dependencies are listed in the correct `package.json` files.

#### 2.4 Get Connection String

1. Go to "Clusters"
2. Click "Connect"
3. Select "Drivers"
4. Copy the connection string
5. Replace `<password>` with your password
6. Copy this URL - **you'll need it for Vercel**

Example format:
```
mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
```

### Phase 3: Deploy to Vercel

#### 3.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect your GitHub repository
4. Vercel will auto-detect the settings from `vercel.json`

#### 3.2 Configure Environment Variables

In the Vercel project settings, add these environment variables:

```
MONGODB_URI = [Your MongoDB connection string]
JWT_SECRET = [Generate a random secret: use online UUID generator]
NODE_ENV = production
```

#### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Your app will be available at: `https://your-project-name.vercel.app`

### Phase 4: Access Your Application

**Frontend URL:** `https://your-project-name.vercel.app`

You can now access it from:
- ✅ Any phone (iOS/Android)
- ✅ Any computer
- ✅ Any tablet
- ✅ Any device with internet

## Limitations with Vercel

1. **Real-time Chat:** Socket.io may not work reliably with Vercel's serverless functions due to connection limits and cold starts.

2. **File Uploads:** Large file uploads may timeout.

3. **Database Connections:** Each function call creates a new database connection.

## Alternative: Hybrid Deployment

For better real-time functionality, consider:

1. **Deploy Frontend to Vercel** (as above)
2. **Deploy Backend to Render** (keep current Render setup for API)

This gives you the best of both worlds: fast frontend deployment with reliable backend for real-time features.

Would you like me to help set up the hybrid deployment instead?
FRONTEND_URL=https://lending-marketplace-ui.onrender.com
```

### Frontend (.env on Render)
```
REACT_APP_API_URL=https://lending-marketplace-api.onrender.com/api
NODE_ENV=production
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Verify connection string in .env
- Check IP whitelist in MongoDB Atlas
- Ensure username/password are correct

### "Frontend blank page"
- Check browser console (F12) for errors
- Verify `REACT_APP_API_URL` in frontend environment variables
- Check that backend service is running

### "QR code not generating"
- Ensure backend has been redeployed
- Check that loan status is "active"
- Verify `qrcode` npm package is installed

### "Slow deployment"
- Free tier on Render is slower (~30 sec startup)
- Upgrade to paid tier for faster performance
- Clear build cache if stuck

## Scaling for Production

### When ready for real users:

1. **Upgrade MongoDB:**
   - From free tier to M10+ cluster
   - Enable backups
   - Enable encryption at rest

2. **Upgrade Render Services:**
   - From Free to Starter ($7/month)
   - Enable auto-scaling
   - Add multiple instances

3. **Add CDN:**
   - Use Cloudflare (free tier available)
   - Speed up static assets
   - DDoS protection

4. **Enable SSL/HTTPS:**
   - Render provides free SSL
   - Use custom domain (`.com`)

5. **Add Authentication:**
   - Enable 2FA
   - Add email verification
   - Implement rate limiting

6. **Monitoring:**
   - Set up error tracking (Sentry)
   - Add performance monitoring
   - Create uptime alerts

## API Endpoints After Deployment

All endpoints are now accessible at:
```
https://lending-marketplace-api.onrender.com/api
```

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Loans
- `POST /loans` - Create loan request
- `GET /loans/user/:userId` - Get user's loans
- `PUT /loans/:id/accept` - Accept loan (generates QR)
- `GET /loans/:id/qrcode` - Get QR code
- `POST /loans/:id/verify-exchange` - Verify exchange
- `POST /loans/:id/payment` - Record payment

### Marketplace
- `GET /marketplace/available-loans` - Browse loans
- `GET /marketplace/available-lenders` - Find lenders

### Collateral
- `POST /collateral` - Add collateral
- `GET /collateral/user/:userId` - Get user's collateral

### Chat
- `GET /chat/conversations/:userId` - Get conversations
- `POST /chat/message` - Send message

## Custom Domain (Optional)

To use your own domain (e.g., `lendingmarketplace.com`):

1. Purchase domain from GoDaddy, Namecheap, etc.
2. Go to your Render service settings
3. Click "Custom Domain"
4. Enter your domain
5. Update DNS records as instructed by Render

## Support & Help

For Render deployment issues:
- [Render Docs](https://render.com/docs)
- [Render Support](https://support.render.com)

For MongoDB issues:
- [MongoDB Docs](https://docs.mongodb.com)
- [MongoDB Support](https://support.mongodb.com)

For your application:
- Check terminal logs in Render dashboard
- Review browser console (F12)
- Check MongoDB Atlas logs

---

**Congratulations!** Your Lending Marketplace is now deployed and accessible worldwide! 🎉
