const express = require('express');
const LendingOffer = require('../models/LendingOffer');
const auth = require('../middleware/auth');
const QRCode = require('qrcode');
const crypto = require('crypto');
const router = express.Router();

// Create a new lending offer (lenders only)
router.post('/', auth, async (req, res) => {
  try {
    const { lenderName, amount, interestRate, loanTerm, description, lenderDetails, terms } = req.body;

    // Get user info from token
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!amount || amount <= 100) {
      return res.status(400).json({ error: 'Lending amount must be greater than 100' });
    }

    // Verify user is a lender
    if (!['lender', 'both'].includes(user.userType)) {
      return res.status(403).json({ error: 'Only lenders can create lending offers' });
    }

    const lendingOffer = new LendingOffer({
      lenderId: req.userId,
      lenderName: lenderName || `${user.firstName} ${user.lastName}`,
      lenderEmail: user.email,
      lenderPhone: user.phone,
      amount,
      interestRate,
      loanTerm,
      description,
      lenderDetails: lenderDetails || {},
      terms: terms || {}
    });

    await lendingOffer.save();
    res.status(201).json({
      message: 'Lending offer created successfully',
      lendingOffer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my lending offers (authenticated lender)
router.get('/my-offers/list', auth, async (req, res) => {
  try {
    const offers = await LendingOffer.find({ lenderId: req.userId })
      .populate('acceptedApplications.borrowerId', 'firstName lastName email phone creditScore')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active lending offers (for borrowers to browse)
router.get('/', async (req, res) => {
  try {
    const offers = await LendingOffer.find({ status: 'active' })
      .populate('lenderId', 'firstName lastName profileImage creditScore')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lending offer by ID
router.get('/:id', async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id)
      .populate('lenderId', 'firstName lastName profileImage creditScore phone email');
    if (!offer) {
      return res.status(404).json({ error: 'Lending offer not found' });
    }
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lending offer
router.put('/:id', auth, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Lending offer not found' });
    }

    // Verify ownership
    if (offer.lenderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { lenderName, amount, interestRate, loanTerm, description, lenderDetails, terms, status } = req.body;

    Object.assign(offer, {
      lenderName: lenderName || offer.lenderName,
      amount: amount || offer.amount,
      interestRate: interestRate !== undefined ? interestRate : offer.interestRate,
      loanTerm: loanTerm || offer.loanTerm,
      description: description || offer.description,
      lenderDetails: lenderDetails || offer.lenderDetails,
      terms: terms || offer.terms,
      status: status || offer.status,
      updatedAt: new Date()
    });

    await offer.save();
    res.json({
      message: 'Lending offer updated',
      offer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lending offer
router.delete('/:id', auth, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Lending offer not found' });
    }

    // Verify ownership
    if (offer.lenderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await LendingOffer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lending offer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for a lending offer (borrower)
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Lending offer not found' });
    }

    // Check if already applied
    const alreadyApplied = offer.acceptedApplications.some(
      app => app.borrowerId.toString() === req.userId
    );
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this offer' });
    }

    offer.acceptedApplications.push({
      borrowerId: req.userId,
      status: 'pending',
      appliedAt: new Date()
    });

    await offer.save();
    res.json({
      message: 'Application submitted successfully',
      offer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle application status (Accept/Decline)
router.patch('/:id/applications/:borrowerId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const offer = await LendingOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Lending offer not found' });
    
    // Verify ownership
    if (offer.lenderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const application = offer.acceptedApplications.find(app => {
      if (!app.borrowerId) return false;
      // Robust ID comparison: handles populated objects or raw ObjectIds
      const applicantId = app.borrowerId._id ? app.borrowerId._id.toString() : app.borrowerId.toString();
      return applicantId === req.params.borrowerId;
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application has already been processed' });
    }

    application.status = status;

    if (status === 'accepted') {
      const Loan = require('../models/Loan');
      const User = require('../models/User');

      const borrower = await User.findById(req.params.borrowerId);
      const lender = await User.findById(req.userId);

      const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

      // Generate QR Data for in-person exchange
      const qrData = {
        loanId: `LOAN-OFFER-${Date.now()}`,
        amount: offer.amount,
        borrower: `${borrower.firstName} ${borrower.lastName}`,
        lender: `${lender.firstName} ${lender.lastName}`,
        verificationCode: verificationCode,
        timestamp: new Date().toISOString()
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300
      });

      const platformFeeAmount = offer.amount * 0.02; // 2% platform fee

      const newLoan = new Loan({
        loanId: qrData.loanId,
        borrowerId: borrower._id,
        lenderId: lender._id,
        amount: offer.amount,
        interestRate: offer.interestRate,
        loanTerm: offer.loanTerm * 30, // Assuming LenderOffer uses months, Loan uses days
        status: 'active',
        startDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + (offer.loanTerm * 30) * 24 * 60 * 60 * 1000),
        qrCode: qrCodeDataUrl,
        verificationCode: verificationCode,
        platformFeeAmount,
        lenderReceives: offer.amount - platformFeeAmount,
        platformRevenue: platformFeeAmount,
        remainingBalance: offer.amount,
        collateralValue: 0, // Default for marketplace offers
        paymentPeriod: 30,  // Default monthly period
        purpose: `Accepted Offer: ${offer.description || 'Lending Marketplace Offer'}`
      });

      await newLoan.save();

      // Notify borrower via Socket.io if available
      const { io } = require('../index');
      if (io) {
        io.to(borrower._id.toString()).emit('notification', {
          type: 'OFFER_ACCEPTED',
          title: 'Offer Application Accepted',
          message: `${lender.firstName} accepted your application for ZMW ${offer.amount}. Exchange verified via QR.`,
          loanId: newLoan._id
        });
      }
    }

    await offer.save();
    res.json({ message: `Application ${status} successfully`, offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
