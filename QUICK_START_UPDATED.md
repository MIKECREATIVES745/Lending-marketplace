# Quick Start Guide - Fixed Version

## Prerequisites
- Node.js installed
- MongoDB installed

## Step 1: Start MongoDB
```bash
mongod --dbpath "c:\Users\Mutale\LendingMarketplace\mongodb\data"
```
Keep this terminal open

## Step 2: Start Backend (New Terminal)
```bash
cd c:\Users\Mutale\LendingMarketplace\backend
npm start
```
Keep this terminal open

## Step 3: Start Frontend (New Terminal)
```bash
cd c:\Users\Mutale\LendingMarketplace\frontend
npm start
```

## Step 4: Test the Application
1. Open http://localhost:3000
2. **Register** a new account or login with:
   - Email: john@test.com
   - Password: password123
3. Click **"Collateral"** (📦) button in navigation
4. Click **"+ Add New Item"** to upload collateral
5. Fill in details and upload photos/documents

## File Upload Works ✓
- Images: JPG, PNG, GIF
- Documents: PDF, Word, TXT
- Max size: 10MB per file
- Files saved to: `/uploads/`

## Login Works ✓
- All users can login/register
- JWT tokens generated
- Session stored in localStorage

## What Changed

### Backend
- Added multer middleware for file uploads
- Collateral routes now accept file uploads
- Serves uploaded files at `/uploads` endpoint
- Better CORS configuration

### Frontend
- New CollateralUpload component
- Added collateral navigation button
- Better login error messages
- FormData support for file uploads

## Troubleshooting

**Issue:** Login shows "Server connection failed"
- Make sure MongoDB is running
- Make sure backend is running on port 5000

**Issue:** File upload fails
- Check file size (max 10MB)
- Use supported formats: JPG, PNG, GIF, PDF, Word, TXT

**Issue:** Files not showing after upload
- Files are saved to `/uploads/` directory
- Check console for upload errors
