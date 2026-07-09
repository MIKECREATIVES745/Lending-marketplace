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
  const conditions = {};
  
  if (query.status && query.status !== 'all') {
    conditions.status = query.status;
  } else if (!query.status || query.status === 'revenue') {
    conditions.status = 'completed';
  }

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
    const disputedGigs = await Gig.countDocuments({ status: 'disputed' });

    res.json({
      stats: {
        totalGigs,
        openGigs,
        inProgressGigs,
        completedGigs,
        disputedGigs
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending BC Payable Loan applications
router.get('/bc-applications', auth, requireAdmin, async (req, res) => {
  try {
    const applications = await Loan.find({ 
      purpose: "BC Payable Student Loan",
      status: 'pending' 
    }).populate('borrowerId', 'firstName lastName email phone');
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all Gig Workers for the admin table
router.get('/workers', auth, requireAdmin, async (req, res) => {
  try {
    // Get users who are explicitly workers OR have at least one assigned gig
    const assignedWorkerIds = await Gig.distinct('assignedWorkerId', { assignedWorkerId: { $ne: null } });
    
    const workers = await User.find({
      $or: [
        { isGigWorker: true },
        { _id: { $in: assignedWorkerIds } }
      ]
    }).select('firstName lastName email creditScore successfulPayments createdAt isGigWorker');
    
    // Enrich with stats: earnings and completion counts
    const workerStats = await Promise.all(workers.map(async (worker) => {
      const stats = await Gig.aggregate([
        { $match: { assignedWorkerId: worker._id, status: 'completed' } },
        { $group: { 
            _id: null, 
            earnings: { $sum: { $convert: { input: "$netWorkerPay", to: "double", onError: 0, onNull: 0 } } },
            count: { $sum: 1 }
          }
        }
      ]);
      
      return {
        ...worker.toObject(),
        completedGigs: stats[0]?.count || 0,
        totalEarnings: stats[0]?.earnings || 0
      };
    }));

    res.json(workerStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all Gigs for the admin management table
router.get('/gigs', auth, requireAdmin, async (req, res) => {
  try {
    const query = buildGigQuery(req.query);
    const gigs = await Gig.find(query)
      .populate('posterId', 'firstName lastName email')
      .populate('assignedWorkerId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/revenue-trends', auth, requireAdmin, async (req, res) => {
  try {
    const loanQuery = buildLoanQuery(req.query);
    // Revenue for gigs is recognized when they are completed
    const gigQuery = buildGigQuery({ ...req.query, status: 'completed' });

    const [loans, gigs] = await Promise.all([
      Loan.find(loanQuery).select('platformFeeAmount paymentPlatformFeeTotal createdAt'),
      Gig.find(gigQuery).select('platformFee budget updatedAt createdAt')
    ]);

    const trends = {};

    loans.forEach(loan => {
      const date = new Date(loan.createdAt).toISOString().split('T')[0];
      if (!trends[date]) trends[date] = { date, loanRevenue: 0, gigRevenue: 0, total: 0 };
      // Include both upfront platform fees and total payment processing fees accumulated
      const rev = (loan.platformFeeAmount || 0) + (loan.paymentPlatformFeeTotal || 0);
      trends[date].loanRevenue += rev;
      trends[date].total += rev;
    });

    gigs.forEach(gig => {
      const date = new Date(gig.updatedAt || gig.createdAt).toISOString().split('T')[0];
      if (!trends[date]) trends[date] = { date, loanRevenue: 0, gigRevenue: 0, total: 0 };
      // Ensure numeric calculation for trends
      const rev = parseFloat(gig.platformFee) || (parseFloat(gig.budget) ? parseFloat(gig.budget) * 0.1 : 0);
      trends[date].gigRevenue += rev;
      trends[date].total += rev;
    });

    const chartData = Object.values(trends)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        loanRevenue: Math.round(item.loanRevenue * 100) / 100,
        gigRevenue: Math.round(item.gigRevenue * 100) / 100,
        total: Math.round(item.total * 100) / 100
      }));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', auth, requireAdmin, async (req, res) => {
  try {
    const query = buildLoanQuery(req.query);
    const loans = await Loan.find(query);

    // Calculate Gig Revenue (10% platform fee)
    // Ensure we only calculate revenue from completed gigs for the summary
    const gigQuery = buildGigQuery({ ...req.query, status: 'completed' });
    const completedGigs = await Gig.find(gigQuery);
    // Use stored platformFee or fallback to 10% calculation with robust numeric conversion and rounding
    const gigPlatformFees = completedGigs.reduce((sum, gig) => 
      sum + (parseFloat(gig.platformFee) || (parseFloat(gig.budget) ? parseFloat(gig.budget) * 0.1 : 0)), 0);

    const totalLoanVolume = loans.reduce((sum, loan) => sum + (parseFloat(loan.amount) || 0), 0);
    const totalPlatformFees = loans.reduce((sum, loan) => sum + (parseFloat(loan.platformFeeAmount) || 0) + (parseFloat(loan.paymentPlatformFeeTotal) || 0), 0) + gigPlatformFees;
    const totalLoansFunded = loans.filter(loan => loan.status !== 'pending').length;
    
    const totalActive = loans.filter(loan => loan.status === 'active').length;
    const totalCompleted = loans.filter(loan => loan.status === 'completed').length;
    const totalPending = loans.filter(loan => loan.status === 'pending').length;

    res.json({
      totalLoanVolume,
      totalPlatformFees,
      loanFees: Math.round((totalPlatformFees - gigPlatformFees) * 100) / 100,
      gigFees: Math.round(gigPlatformFees * 100) / 100,
      // Add alias keys in case frontend is looking for different names
      gigPlatformRevenue: Math.round(gigPlatformFees * 100) / 100,
      platformRevenue: Math.round(totalPlatformFees * 100) / 100,
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
        platformFeeAmount: Number(gig.platformFee) || (Number(gig.budget) ? Number(gig.budget) * 0.1 : 0),
        paymentPlatformFeeTotal: 0,
        platformRevenue: Number(gig.platformFee) || (Number(gig.budget) ? Number(gig.budget) * 0.1 : 0),
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

// Manage Disputes
router.get('/disputes', auth, requireAdmin, async (req, res) => {
  try {
    const disputedGigs = await Gig.find({ status: 'disputed' })
      .populate('posterId', 'firstName lastName email')
      .populate('assignedWorkerId', 'firstName lastName email');
    res.json(disputedGigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/disputes/:id/resolve', auth, requireAdmin, async (req, res) => {
  try {
    const { resolution } = req.body; // 'release' to worker or 'refund' to poster
    const gig = await Gig.findById(req.params.id);

    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    if (resolution === 'release') {
      gig.status = 'completed';
      gig.escrowStatus = 'released';
      const platformFee = gig.budget * 0.10;
      gig.platformFee = platformFee;
      gig.netWorkerPay = gig.budget - platformFee;
    } else if (resolution === 'refund') {
      gig.status = 'cancelled';
      gig.escrowStatus = 'refunded';
    } else {
      return res.status(400).json({ error: 'Invalid resolution type' });
    }

    await gig.save();
    res.json({ message: `Dispute resolved with ${resolution}`, gig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
