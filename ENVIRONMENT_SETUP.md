# ENVIRONMENT_SETUP.md

# Environment Configuration Guide

## Local Development Setup

### Backend Environment Variables

Create `backend/.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/lending-marketplace
# If using MongoDB Atlas instead:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lending-marketplace

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
NODE_ENV=development
```

## Production Setup

### Google Cloud Environment Variables

#### Backend Service
Set these in Google Cloud Run → Environment Variables:

```
KEY: MONGODB_URI
VALUE: mongodb+srv://admin:YOUR_PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority

KEY: JWT_SECRET
VALUE: [Use strong random UUID - https://www.uuidgenerator.net/]

KEY: NODE_ENV
VALUE: production

KEY: PORT
VALUE: 8080

KEY: FRONTEND_URL
VALUE: https://lending-marketplace-ui-XXXXX.run.app
```

#### Frontend Service
```
KEY: REACT_APP_API_URL
VALUE: https://lending-marketplace-api-XXXXX.run.app/api

KEY: NODE_ENV
VALUE: production

KEY: PORT
VALUE: 3000
```

## Environment Variable Explanation

### Backend Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection string | `mongodb://localhost:27017/lending-marketplace` |
| `PORT` | Server port | `5000` (dev) or `8080` (cloud) |
| `NODE_ENV` | Environment type | `development` or `production` |
| `JWT_SECRET` | Token signing key | Strong random string (min 32 chars) |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` (dev) or URL (prod) |

### Frontend Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_API_URL` | Backend API endpoint | `http://localhost:5000/api` (dev) |
| `NODE_ENV` | Build environment | `development` or `production` |
| `PORT` | Frontend port | `3000` |

## MongoDB Atlas Setup

### Step 1: Create Connection String

```
mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
```

Replace:
- `admin` - Your database username
- `PASSWORD` - Your database password
- `cluster` - Your cluster name

### Step 2: Environment Variable
Add to backend environment:
```
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/lending-marketplace?retryWrites=true&w=majority
```

## JWT Secret Generation

### Option 1: Online Generator
Visit: https://www.uuidgenerator.net/
Copy the generated UUID and use as JWT_SECRET

### Option 2: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 3: OpenSSL
```bash
openssl rand -hex 32
```

## Verification

### Verify Backend Configuration
```bash
# Check if environment variables are loaded
node -e "console.log(process.env.MONGODB_URI)"
```

### Verify Frontend Configuration
```bash
# Check build-time variables
echo $REACT_APP_API_URL
```

## Docker Environment Setup

If using Docker, create `.env` in root:
```env
# Backend
BACKEND_MONGODB_URI=mongodb://mongodb:27017/lending-marketplace
BACKEND_PORT=5000
BACKEND_JWT_SECRET=your_secret_here
BACKEND_NODE_ENV=production
BACKEND_FRONTEND_URL=http://lending-marketplace-ui:3000

# Frontend
FRONTEND_REACT_APP_API_URL=http://lending-marketplace-api:5000/api
FRONTEND_NODE_ENV=production
FRONTEND_PORT=3000

# MongoDB (if using docker-compose MongoDB)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure_password_here
```

Then reference in `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      MONGODB_URI: ${BACKEND_MONGODB_URI}
      PORT: ${BACKEND_PORT}
      JWT_SECRET: ${BACKEND_JWT_SECRET}
```

## Environment Validation

### Pre-deployment Checklist

- [ ] `MONGODB_URI` is valid and tested
- [ ] `JWT_SECRET` is strong (min 32 chars, random)
- [ ] `FRONTEND_URL` matches actual frontend domain
- [ ] `REACT_APP_API_URL` matches actual backend API domain
- [ ] No secrets committed to Git
- [ ] `.env` files are in `.gitignore`
- [ ] All variables tested locally first

### Test Connection
```bash
# Test MongoDB connection
mongosh "mongodb+srv://admin:PASSWORD@cluster.mongodb.net/" --eval "db.adminCommand('ping')"

# Test backend startup
npm run dev

# Test frontend build
npm run build
```

## Common Issues

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution:**
- Ensure MongoDB is running locally: `mongod`
- Or verify MongoDB Atlas credentials
- Check network whitelist in MongoDB Atlas

### Invalid JWT Secret
```
Error: secretOrPrivateKey is required
```
**Solution:**
- Generate strong JWT_SECRET
- Set it in environment variables
- Restart server

### CORS Errors in Browser
```
Access to XMLHttpRequest... has been blocked by CORS policy
```
**Solution:**
- Update `FRONTEND_URL` in backend to match actual frontend domain
- Restart backend server
- Check CORS configuration in `backend/src/index.js`

### Frontend Can't Connect to API
```
Error: Network Error
```
**Solution:**
- Update `REACT_APP_API_URL` in frontend `.env`
- Rebuild frontend: `npm run build`
- Ensure backend is running
- Check browser network tab for actual URL being called

## Security Best Practices

1. **Never commit `.env` files to Git**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use strong JWT secrets**
   ```bash
   # Generate: openssl rand -hex 32
   JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

3. **Rotate secrets periodically**
   - Change JWT_SECRET every 6 months
   - Update database passwords annually

4. **Environment-specific values**
   ```env
   # Development - can be less strict
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/lending-dev

   # Production - must be secure
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://admin:strong_password@prod-cluster.mongodb.net/lending
   ```

5. **Use secrets manager in production**
   - Google Cloud Secret Manager
   - AWS Secrets Manager
   - HashiCorp Vault

## Troubleshooting Environment Issues

### Check all environment variables
```bash
# Linux/Mac
env | grep -E "MONGODB|JWT|NODE|FRONTEND|REACT"

# Windows PowerShell
Get-ChildItem Env: | Where-Object {$_.Name -match "MONGODB|JWT|NODE|FRONTEND|REACT"}
```

### Debug environment loading
```bash
# Add to backend/src/index.js
console.log("Environment Variables Loaded:");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "***" : "NOT SET");
```

### Test in isolation
```bash
# Test just database connection
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected'))
  .catch(err => console.log('✗ Error:', err.message));
"
```

## Reference Guides

- [MongoDB Connection String Formats](https://docs.mongodb.com/manual/reference/connection-string/)
- [Google Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/services/environment-variables)
- [Express dotenv](https://www.npmjs.com/package/dotenv)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
