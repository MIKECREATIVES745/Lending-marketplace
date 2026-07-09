const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User'); // Import User model for admin check
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');
const router = express.Router();

const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE || '0.02');
const PAYMENT_FEE_RATE = parseFloat(process.env.PAYMENT_FEE_RATE || '0.005');

// Middleware to ensure user is an admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user; // Attach admin user to request
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin authorization error' });
  }
};

// Create loan request
router.post('/', async (req, res) => {
  try {
    const { borrowerId, amount, interestRate, loanTerm, paymentPeriod, collateralValue, purpose } = req.body;
    
    const loan = new Loan({
      loanId: `LOAN-${Date.now()}`,
      borrowerId,
      amount,
      interestRate,
      loanTerm,
      paymentPeriod,
      collateralValue,
      purpose,
      platformFeeRate: PLATFORM_FEE_RATE,
      paymentFeeRate: PAYMENT_FEE_RATE,
      remainingBalance: amount
    });
    
    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Apply for a BC Payable Student Loan
router.post('/bc-apply', auth, async (req, res) => {
  try {
    const { amount, studentDetails, phoneNumber } = req.body;

    const loan = new Loan({
      loanId: `BC-${Date.now()}`,
      borrowerId: req.userId,
      amount: parseFloat(amount),
      interestRate: 0, // BC loans typically have special terms
      loanTerm: 30,    // Default term
      paymentPeriod: 30,
      collateralValue: 0,
      purpose: "BC Payable Student Loan",
      status: 'pending', // Awaiting admin review
      studentDetails: studentDetails, // Ensure your Loan model supports this or use purpose
      phoneNumber: phoneNumber,
      remainingBalance: parseFloat(amount),
      totalRepaid: 0,
      paymentPlatformFeeTotal: 0,
      verificationCode: `BC-PENDING-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      // Initialize these fields to prevent Mongoose validation errors
      platformFeeRate: PLATFORM_FEE_RATE,
      paymentFeeRate: PAYMENT_FEE_RATE,
      platformFeeAmount: 0,
      lenderReceives: 0,
      platformRevenue: 0
    });

    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Admin approves a BC Payable Student Loan
router.post('/:id/approve-bc', auth, requireAdmin, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('borrowerId');

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.purpose !== "BC Payable Student Loan" || loan.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending BC Payable Loans can be approved' });
    }

    // Generate unique verification code
    const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Generate QR Code with loan details
    const qrData = {
      loanId: loan.loanId,
      amount: loan.amount,
      borrower: loan.borrowerId.firstName + ' ' + loan.borrowerId.lastName,
      lender: req.user.firstName + ' ' + req.user.lastName, // Admin is the lender for BC loans
      verificationCode: verificationCode,
      timestamp: new Date().toISOString()
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });

    const platformFeeAmount = loan.amount * (loan.platformFeeRate || PLATFORM_FEE_RATE);
    const lenderReceives = loan.amount - platformFeeAmount;

    // Update loan status and details
    loan.status = 'active';
    loan.lenderId = req.userId; // Admin becomes the lender for this BC loan
    loan.startDate = new Date();
    loan.expectedCompletionDate = new Date(Date.now() + loan.loanTerm * 24 * 60 * 60 * 1000);
    loan.qrCode = qrCodeDataUrl;
    loan.verificationCode = verificationCode;
    loan.platformFeeAmount = platformFeeAmount;
    loan.lenderReceives = lenderReceives;
    loan.platformRevenue = platformFeeAmount;
    loan.updatedAt = new Date();

    await loan.save();

    // Emit notification to the borrower
    const { io } = require('../index');
    if (io) {
      io.to(loan.borrowerId._id.toString()).emit('notification', {
        type: 'BC_LOAN_APPROVED',
        title: 'BC Payable Loan Approved! 🎉',
        message: `Your BC Payable Loan for K${loan.amount} has been approved.`,
        loanId: loan._id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'BC Payable Loan approved successfully', loan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loans for user
router.get('/user/:userId', async (req, res) => {
  try {
    const loans = await Loan.find({
      $or: [
        { borrowerId: req.params.userId },
        { lenderId: req.params.userId }
      ]
    }).populate('borrowerId lenderId');
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific loan
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('borrowerId lenderId');
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept loan (lender perspective) + Generate QR Code
router.put('/:id/accept', async (req, res) => {
  try {
    const { lenderId } = req.body;
    
    // Generate unique verification code
    const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const loan = await Loan.findById(req.params.id).populate('borrowerId lenderId');
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Generate QR Code with loan details
    const qrData = {
      loanId: loan.loanId,
      amount: loan.amount,
      borrower: loan.borrowerId.firstName + ' ' + loan.borrowerId.lastName,
      lender: loan.lenderId?.firstName + ' ' + loan.lenderId?.lastName || 'TBD',
      verificationCode: verificationCode,
      timestamp: new Date().toISOString()
    };
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
    
    const platformFeeAmount = loan.amount * (loan.platformFeeRate || PLATFORM_FEE_RATE);
    const lenderReceives = loan.amount - platformFeeAmount;

    // Update loan
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      { 
        lenderId,
        status: 'active',
        startDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + loan.loanTerm * 24 * 60 * 60 * 1000),
        qrCode: qrCodeDataUrl,
        verificationCode: verificationCode,
        platformFeeAmount,
        lenderReceives,
        platformRevenue: platformFeeAmount
      },
      { new: true }
    ).populate('borrowerId lenderId');

    // Emit notification to the borrower
    const { io } = require('../index');
    if (io) {
      io.to(updatedLoan.borrowerId._id.toString()).emit('notification', {
        type: 'LOAN_ACCEPTED',
        title: 'Loan Request Accepted',
        message: `Your loan request for K${updatedLoan.amount} has been accepted.`,
        loanId: updatedLoan._id,
        timestamp: new Date()
      });
    }

    res.json(updatedLoan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record payment
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount } = req.body;
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    const paymentFeeRate = loan.paymentFeeRate || PAYMENT_FEE_RATE;
    const paymentFeeAmount = amount * paymentFeeRate;
    const netPaymentToLender = amount - paymentFeeAmount;

    // Update payment
    loan.totalRepaid += amount;
    loan.remainingBalance -= amount;
    loan.paymentPlatformFeeTotal = (loan.paymentPlatformFeeTotal || 0) + paymentFeeAmount;
    loan.platformRevenue = (loan.platformRevenue || 0) + paymentFeeAmount;
    loan.lenderReceives = (loan.lenderReceives || 0) + netPaymentToLender;
    
    if (loan.remainingBalance <= 0) {
      loan.status = 'completed';
      loan.completedAt = new Date();
    }
    
    await loan.save();

    // Emit notification to the lender
    const { io } = require('../index');
    if (io && loan.lenderId) {
      io.to(loan.lenderId.toString()).emit('notification', {
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `You received a payment of K${amount} for loan ${loan.loanId}.`,
        loanId: loan._id,
        timestamp: new Date()
      });
    }

    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR Code for loan
router.get('/:id/qrcode', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (!loan.qrCode) {
      return res.status(400).json({ error: 'QR code not yet generated. Lender must accept the loan first.' });
    }
    
    res.json({
      loanId: loan.loanId,
      qrCode: loan.qrCode,
      verificationCode: loan.verificationCode,
      status: loan.status,
      exchangeVerified: loan.exchangeVerified
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify exchange (scan QR code during in-person meeting)
router.post('/:id/verify-exchange', async (req, res) => {
  try {
    const { verificationCode } = req.body;
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (loan.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Mark as verified
    loan.exchangeVerified = true;
    loan.verifiedAt = new Date();
    await loan.save();
    
    res.json({
      success: true,
      message: 'Exchange verified successfully',
      loan: loan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
