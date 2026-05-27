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

const buildDateRange = (startDate, endDate) => {
  const range = {};
  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start)) range.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end)) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }
  return Object.keys(range).length > 0 ? range : null;
};

const buildLoanQuery = (query) => {
  const conditions = {};

  const dateRange = buildDateRange(query.startDate, query.endDate);
  if (dateRange) conditions.createdAt = dateRange;

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

const buildGigQuery = (query) => {
  const conditions = { status: 'completed' };
  const dateRange = buildDateRange(query.startDate, query.endDate);
  if (dateRange) conditions.updatedAt = dateRange;

  if (query.borrowerId && mongoose.Types.ObjectId.isValid(query.borrowerId)) {
    conditions.assignedWorkerId = query.borrowerId;
  }

  if (query.lenderId && mongoose.Types.ObjectId.isValid(query.lenderId)) {
    conditions.posterId = query.lenderId;
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

    // Calculate Gig Revenue (10% platform fee)
    const gigQuery = buildGigQuery(req.query);
    const completedGigs = await Gig.find(gigQuery);
    const gigPlatformFees = completedGigs.reduce((sum, gig) => sum + (gig.platformFee || 0), 0);

    const totalLoanVolume = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalPlatformFees = loans.reduce((sum, loan) => sum + (loan.platformFeeAmount || 0) + (loan.paymentPlatformFeeTotal || 0), 0) + gigPlatformFees;
    const totalLoansFunded = loans.filter(loan => loan.status !== 'pending').length;
    
    const totalActive = loans.filter(loan => loan.status === 'active').length;
    const totalCompleted = loans.filter(loan => loan.status === 'completed').length;
    const totalPending = loans.filter(loan => loan.status === 'pending').length;

    res.json({
      totalLoanVolume,
      totalPlatformFees,
      loanFees: totalPlatformFees - gigPlatformFees,
      gigFees: gigPlatformFees,
      totalLoansFunded,
      totalActive,
      totalCompleted,
      totalPending,
      totalTransactions: loans.length + completedGigs.length
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

    // Include Gig transactions for revenue transparency
    const gigQuery = buildGigQuery(req.query);
    const gigs = await Gig.find(gigQuery)
      .populate('posterId', 'firstName lastName email')
      .populate('assignedWorkerId', 'firstName lastName email');

    const transactions = [
      ...loans.map((loan) => ({
        id: loan._id,
        loanId: loan.loanId,
        borrower: loan.borrowerId ? `${loan.borrowerId.firstName} ${loan.borrowerId.lastName}` : 'Unknown',
        lender: loan.lenderId ? `${loan.lenderId.firstName} ${loan.lenderId.lastName}` : 'Unassigned',
        amount: loan.amount,
        platformFeeAmount: loan.platformFeeAmount || 0,
        paymentPlatformFeeTotal: loan.paymentPlatformFeeTotal || 0,
        platformRevenue: loan.platformRevenue || 0,
        status: loan.status,
        createdAt: loan.createdAt,
        type: 'Loan'
      })),
      ...gigs.map((gig) => ({
        id: gig._id,
        loanId: `GIG-${gig._id.toString().slice(-6).toUpperCase()}`,
        borrower: gig.assignedWorkerId ? `${gig.assignedWorkerId.firstName} ${gig.assignedWorkerId.lastName}` : 'Worker', // The one receiving funds
        lender: gig.posterId ? `${gig.posterId.firstName} ${gig.posterId.lastName}` : 'Poster', // The one paying
        amount: gig.budget,
        platformFeeAmount: gig.platformFee || 0,
        paymentPlatformFeeTotal: 0,
        platformRevenue: gig.platformFee || 0,
        status: gig.status === 'completed' ? 'Revenue Collected' : gig.status,
        createdAt: gig.updatedAt || gig.createdAt,
        type: 'Gig'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
