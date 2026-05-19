const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const Loan = require('../models/Loan');
const User = require('../models/User');
const router = express.Router();

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
      remainingBalance: amount
    });
    
    await loan.save();
    res.status(201).json(loan);
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
    
    // Update loan
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      { 
        lenderId,
        status: 'active',
        startDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + loan.loanTerm * 24 * 60 * 60 * 1000),
        qrCode: qrCodeDataUrl,
        verificationCode: verificationCode
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
    
    // Update payment
    loan.totalRepaid += amount;
    loan.remainingBalance -= amount;
    
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
