# DEPLOYMENT_GOOGLE_CLOUD.md

# Deploy Creative Lending Marketplace to Google Cloud Platform

This guide provides step-by-step instructions to deploy your lending marketplace to Google Cloud Platform.

## Prerequisites

1. **Google Cloud Account** - [Sign up free](https://cloud.google.com)
2. **GitHub Account** - [Sign up](https://github.com/signup)
3. **Git installed** - [Download](https://git-scm.com)
4. **gcloud CLI** - [Download](https://cloud.google.com/sdk/docs/install)
5. **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/cloud/atlas)

## Phase 1: Prepare MongoDB Atlas

### Step 1: Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in or create account
3. Click "Create Project" and name it `lending-marketplace`
4. Click "Create Cluster"
5. Select "Free Tier"
6. Choose region closest to your users
7. Click "Create Cluster" (wait 3-5 minutes)

### Step 2: Create Database User

1. Go to "Database Access" → "Add New Database User"
2. Username: `lending-admin`
3. Password: Generate secure password (save it!)
4. Role: "Atlas Admin"
5. Click "Add User"

### Step 3: Configure Network Access

1. Go to "Network Access" → "Add IP Address"
2. Click "Allow Access from Anywhere" (or whitelist Google Cloud IPs)
3. Click "Confirm"

### Step 4: Get Connection String

1. Go to "Clusters" → "Connect"
2. Select "Drivers"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Save this URL - you'll need it

## Phase 2: Push Code to GitHub

1. Open terminal in project root
2. Run:
```bash
cd c:\Users\Mutale\LendingMarketplace
git init
git add .
git commit -m "Initial commit - production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lending-marketplace.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Phase 3: Deploy to Google Cloud Run

### Option A: Deploy via Google Cloud Console (Easiest)

#### Backend Deployment

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Go to "Cloud Run" → "Create Service"
4. Click "Deploy one from source code repository"
5. Follow prompts:
   - **Repository provider:** GitHub
   - **Repository:** YOUR_USERNAME/lending-marketplace
   - **Branch:** main
   - **Build type:** Dockerfile

6. Configure the service:
   - **Service name:** `lending-marketplace-api`
   - **Region:** us-central1 (or your region)
   - **Authentication:** Allow unauthenticated invocations

7. Click "Advanced settings":
   - **Environment variables:**
     ```
     MONGODB_URI = [Your MongoDB connection string]
     PORT = 8080
     NODE_ENV = production
     JWT_SECRET = [Generate UUID: use online generator]
     FRONTEND_URL = https://lending-marketplace-ui.web.app
     ```

8. Click "Create"
9. Wait for deployment (2-5 minutes)
10. Copy the service URL: `https://lending-marketplace-api-XXXX.run.app`

#### Frontend Deployment

1. In Google Cloud Console, go to "Cloud Run" → "Create Service"
2. Click "Deploy one from source code repository"
3. Select same repository
4. Configure:
   - **Service name:** `lending-marketplace-ui`
   - **Region:** Same as backend
   - **Dockerfile:** Use `frontend/Dockerfile`

5. Click "Advanced settings":
   - **Environment variables:**
     ```
     REACT_APP_API_URL = [Your backend API URL from above]/api
     NODE_ENV = production
     ```

6. Click "Create"

### Option B: Deploy via Command Line (gcloud CLI)

#### Setup gcloud

```bash
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### Backend Deployment

```bash
cd c:\Users\Mutale\LendingMarketplace\backend

gcloud run deploy lending-marketplace-api ^
  --source . ^
  --platform managed ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --set-env-vars "MONGODB_URI=YOUR_MONGODB_URI,JWT_SECRET=YOUR_SECRET,NODE_ENV=production,FRONTEND_URL=https://YOUR_FRONTEND_URL"
```

#### Frontend Deployment

```bash
cd c:\Users\Mutale\LendingMarketplace\frontend

gcloud run deploy lending-marketplace-ui ^
  --source . ^
  --platform managed ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --set-env-vars "REACT_APP_API_URL=YOUR_BACKEND_URL/api,NODE_ENV=production"
```

## Phase 4: Update CORS and URLs

### Backend Configuration

Edit [backend/src/index.js](backend/src/index.js) and ensure CORS includes your frontend URL:

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
```

### Frontend Configuration

Edit [frontend/src/utils/api.js](frontend/src/utils/api.js):

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export default API_URL;
```

## Phase 5: Testing

### Test Backend API

```bash
curl https://your-backend-url/api/health
```

### Test Frontend

1. Open `https://your-frontend-url` in browser
2. Try logging in or creating account
3. Check browser console for errors

## Phase 6: Setup Custom Domain (Optional)

### Map Domain to Cloud Run

1. Go to Cloud Run service
2. Click "Manage Custom Domains"
3. Add your domain
4. Follow DNS configuration steps

## Troubleshooting

### Service won't start

Check logs:
```bash
gcloud run logs read lending-marketplace-api --limit 50
```

### Database connection failed

1. Verify MongoDB URI in environment variables
2. Check MongoDB Atlas network access whitelist includes Google Cloud IP ranges
3. Test connection string locally

### CORS errors

1. Verify `FRONTEND_URL` environment variable matches actual frontend URL
2. Check backend CORS configuration
3. Restart service after updating environment variables

### High memory/CPU usage

- Adjust Cloud Run memory allocation
- Check for infinite loops in code
- Monitor database queries

## Scaling and Optimization

### Enable Autoscaling

Cloud Run automatically scales - set limits:
- **Min instances:** 0 (to save costs)
- **Max instances:** 100

### Use Cloud SQL for Production

For production, replace MongoDB Atlas with Google Cloud SQL:

1. Go to "Cloud SQL" → "Create Instance"
2. Select MongoDB
3. Configure settings
4. Update `MONGODB_URI` in environment variables

### Use Cloud Storage for Files

1. Set up Cloud Storage bucket
2. Update file upload routes to use Cloud Storage SDK

## Monitoring

### View Logs

```bash
gcloud run logs read lending-marketplace-api --limit 100
gcloud run logs read lending-marketplace-ui --limit 100
```

### Set Up Alerts

1. Go to "Cloud Monitoring"
2. Create alerts for:
   - High error rate
   - High latency
   - Quota exceeded

## Cleanup

To delete services and stop charges:

```bash
gcloud run services delete lending-marketplace-api --region us-central1
gcloud run services delete lending-marketplace-ui --region us-central1
```

## Cost Estimation

- **Cloud Run:** ~$0.15/million requests (generous free tier)
- **MongoDB Atlas:** Free tier available
- **Cloud Storage:** ~$0.02 per GB (if used)

## Support & Documentation

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Google Cloud Platform Pricing](https://cloud.google.com/pricing)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
