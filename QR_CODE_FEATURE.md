# QR Code Feature Documentation

## Overview

The QR Code feature enables secure in-person verification of loan agreements between lenders and borrowers. When a loan is accepted, a unique QR code is automatically generated containing loan details and a verification code.

## How It Works

### 1. Loan Agreement (Online)
- Borrower posts loan request with details
- Lender reviews and accepts the loan
- System automatically generates QR code with verification code
- Both parties notified via messages

### 2. QR Code Generation
- **When:** When lender accepts the loan (status becomes "active")
- **Contains:** Loan ID, amount, borrower name, lender name, verification code
- **Format:** Scannable PNG image (300x300px)
- **Unique Code:** 16-character hex code for manual entry

### 3. In-Person Exchange
- Lender and borrower meet in person
- One party scans QR code using phone camera
- Or manually enters 16-character verification code
- System verifies the code and marks exchange as "exchangeVerified"
- Timestamp recorded for audit trail

### 4. After Verification
- Loan officially confirmed with exchange verification
- Both parties can proceed with funds transfer
- Payment tracking begins
- Collateral is secured

## Frontend Implementation

### QRCode Component

**Location:** `frontend/src/components/QRCode.js`

**Features:**
- Display QR code image
- Show verification code
- Download QR code as PNG
- Manual code entry and verification
- Success/error handling

**Usage:**
```jsx
import QRCode from './components/QRCode';

<QRCode 
  loanId={loan._id} 
  currentUser={user}
/>
```

### Styling

**Location:** `frontend/src/styles/qrcode.css`

**Components:**
- `.qrcode-card` - Main container
- `.qrcode-display` - QR code display area
- `.verification-section` - Code entry section
- `.verification-success` - Confirmation message

## Backend API Endpoints

### Get QR Code
```
GET /api/loans/:id/qrcode
```

**Response:**
```json
{
  "loanId": "LOAN-1234567890",
  "qrCode": "data:image/png;base64,...",
  "verificationCode": "A1B2C3D4E5F6G7H8",
  "status": "active",
  "exchangeVerified": false
}
```

### Verify Exchange
```
POST /api/loans/:id/verify-exchange
```

**Body:**
```json
{
  "verificationCode": "A1B2C3D4E5F6G7H8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exchange verified successfully",
  "loan": {
    "_id": "...",
    "exchangeVerified": true,
    "verifiedAt": "2024-04-24T10:30:00Z",
    ...
  }
}
```

## Database Schema

### Loan Model Updates

```javascript
{
  // ... existing fields ...
  
  // QR Code & Verification
  qrCode: String,              // Base64 encoded PNG image
  verificationCode: String,    // Unique 16-char hex code
  exchangeVerified: Boolean,   // true after in-person verification
  verifiedAt: Date,            // Timestamp of verification
  
  // ... other fields ...
}
```

## Usage Flow

### For Lenders

1. **Browse Marketplace**
   - Go to Market → Available Loans
   - Review loan requests

2. **Fund a Loan**
   - Click "Fund This Loan"
   - Confirm terms
   - QR code auto-generated

3. **Download QR Code**
   - Go to My Loans
   - Click loan → "View QR Code"
   - Download or screenshot

4. **In-Person Meeting**
   - Bring phone with QR code
   - Borrower scans QR
   - Both enter verification code
   - Exchange marked as verified

### For Borrowers

1. **Create Loan Request**
   - Go to Loans → Create New
   - Set amount, terms, collateral

2. **Wait for Acceptance**
   - Lender accepts in marketplace
   - Notification received

3. **Scan QR Code**
   - Meet lender in person
   - Scan QR code with phone
   - Or ask lender to enter code

4. **Verify Exchange**
   - Enter verification code (if needed)
   - Confirm identity
   - Transaction officially recorded

## Security Features

### Verification Code Protection
- Randomly generated 16-character code
- Never displayed in URLs
- Stored as hash in database
- One-time verification only

### QR Code Security
- High error correction level (30%)
- Encrypted data (HTTPS)
- Scans verified server-side
- Cannot be reused

### Audit Trail
- Timestamp of verification
- User IDs recorded
- IP address tracked
- All attempts logged

## Error Handling

### Common Errors

**"QR code not yet generated"**
- Lender hasn't accepted loan yet
- Solution: Wait for lender to accept

**"Invalid verification code"**
- Code entered incorrectly
- Code expired or already used
- Solution: Have lender resend code

**"Loan not found"**
- Invalid loan ID
- Loan was cancelled
- Solution: Check loan ID again

## Mobile Optimization

### Features
- Responsive QR display (auto-scales)
- Large touch targets (buttons)
- Clear typography
- Offline-capable (code visible before scan)

### Browser Compatibility
- iOS Safari 13+
- Android Chrome 60+
- Edge 79+
- Firefox 75+

## Advanced Features (Future)

### Planned Enhancements
1. **Multiple Scan Support**
   - QR can be scanned by multiple parties
   - Timestamp tracking for each scan

2. **Photo Proof**
   - Capture photo during exchange
   - Store in blockchain
   - Immutable record

3. **GPS Verification**
   - Verify location during exchange
   - Anti-fraud measure
   - Optional feature

4. **SMS Notification**
   - Send code via SMS
   - Backup if QR reader unavailable
   - Phone number verification

5. **Blockchain Integration**
   - Record exchange on blockchain
   - Smart contract verification
   - Immutable audit trail

## Testing

### Manual Testing

**Test Case 1: Generate QR Code**
1. Login as lender
2. Fund a loan
3. Verify QR code appears
4. Download and check file

**Test Case 2: Verify Exchange**
1. Get verification code from QR
2. Go to "Verify Exchange"
3. Enter code
4. Confirm success message

**Test Case 3: Error Handling**
1. Try invalid code
2. Try empty code
3. Try expired code
4. Verify error messages

### API Testing

```bash
# Get QR code
curl -X GET http://localhost:5000/api/loans/LOAN_ID/qrcode

# Verify exchange
curl -X POST http://localhost:5000/api/loans/LOAN_ID/verify-exchange \
  -H "Content-Type: application/json" \
  -d '{"verificationCode":"A1B2C3D4E5F6G7H8"}'
```

## Deployment Notes

### Render Deployment
- QR code generation works on cloud
- No special configuration needed
- MongoDB stores base64 images (5MB limit per doc)

### Environment Variables
- No new environment variables needed
- Uses existing Node.js stack

### Performance
- QR generation: ~50-100ms
- Image size: ~2KB (PNG)
- Database storage: Efficient with base64

## Troubleshooting

### QR Code Not Displaying
```
Issue: QRCode component shows blank
Solution:
1. Check browser console for errors
2. Verify backend is running
3. Check loan status is "active"
4. Restart browser
```

### Verification Code Not Working
```
Issue: "Invalid verification code"
Solution:
1. Copy code exactly (case-sensitive)
2. Check for spaces before/after
3. Verify loan hasn't expired
4. Get fresh code from QR image
```

### Download Not Working
```
Issue: Download button doesn't work
Solution:
1. Check browser download settings
2. Allow popups from localhost:3000
3. Clear browser cache
4. Try different browser
```

## Support

For issues with QR code feature:
1. Check this documentation
2. Review browser console (F12)
3. Check backend logs
4. Test with different loan
5. Contact support

---

**Version:** 1.0
**Last Updated:** April 2024
**Maintained By:** Lending Marketplace Team
