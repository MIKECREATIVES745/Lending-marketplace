const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Gig = require('../models/Gig');
const router = express.Router();

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin authorization error' });
  }
};

const buildLoanQuery = (query) => {
  const conditions = {};

  if (query.startDate || query.endDate) {
    conditions.createdAt = {};
    if (query.startDate) conditions.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) conditions.createdAt.$lte = new Date(query.endDate);
  }

  if (query.borrowerId && mongoose.Types.ObjectId.isValid(query.borrowerId)) {
    conditions.borrowerId = query.borrowerId;
  }

  if (query.lenderId && mongoose.Types.ObjectId.isValid(query.lenderId)) {
    conditions.lenderId = query.lenderId;
  }

  if (query.status) {
    conditions.status = query.status;
  }

  return conditions;
};

// Admin Dashboard Stats (Gig-focused)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const totalGigs = await Gig.countDocuments();
    const openGigs = await Gig.countDocuments({ status: 'open' });
    const inProgressGigs = await Gig.countDocuments({ status: 'in-progress' });
    const completedGigs = await Gig.countDocuments({ status: 'completed' });

    res.json({
      stats: {
        totalGigs,
        openGigs,
        inProgressGigs,
        completedGigs
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', auth, requireAdmin, async (req, res) => {
  try {
    const query = buildLoanQuery(req.query);
    const loans = await Loan.find(query);
    const totalLoanVolume = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalPlatformFees = loans.reduce((sum, loan) => sum + (loan.platformFeeAmount || 0) + (loan.paymentPlatformFeeTotal || 0), 0);
    const totalLoansFunded = loans.filter(loan => loan.status !== 'pending').length;
    const totalActive = loans.filter(loan => loan.status === 'active').length;
    const totalCompleted = loans.filter(loan => loan.status === 'completed').length;
    const totalPending = loans.filter(loan => loan.status === 'pending').length;

    res.json({
      totalLoanVolume,
      totalPlatformFees,
      totalLoansFunded,
      totalActive,
      totalCompleted,
      totalPending,
      totalTransactions: loans.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', auth, requireAdmin, async (req, res) => {
  try {
    const query = buildLoanQuery(req.query);
    const loans = await Loan.find(query)
      .populate('borrowerId', 'firstName lastName email')
      .populate('lenderId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const transactions = loans.map((loan) => ({
      id: loan._id,
      loanId: loan.loanId,
      borrowerId: loan.borrowerId?._id,
      borrower: loan.borrowerId ? `${loan.borrowerId.firstName} ${loan.borrowerId.lastName}` : 'Unknown',
      lenderId: loan.lenderId?._id,
      lender: loan.lenderId ? `${loan.lenderId.firstName} ${loan.lenderId.lastName}` : 'Unassigned',
      amount: loan.amount,
      platformFeeAmount: loan.platformFeeAmount || 0,
      paymentPlatformFeeTotal: loan.paymentPlatformFeeTotal || 0,
      platformRevenue: loan.platformRevenue || 0,
      status: loan.status,
      createdAt: loan.createdAt,
      fundedAt: loan.startDate,
      expectedCompletionDate: loan.expectedCompletionDate
    }));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
