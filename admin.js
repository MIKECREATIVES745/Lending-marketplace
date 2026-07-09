const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const auth = require('../middleware/auth');

// Admin API Root - Prevents 404 if the dashboard calls the base admin endpoint
router.get('/', auth, (req, res) => {
  res.json({ status: 'Admin API active', timestamp: new Date() });
});

// Admin Dashboard Stats
router.get('/stats', auth, async (req, res) => {
  console.log(`[Admin] Stats requested by user: ${req.userId}`);
  try {
    // In a real app, verify req.userId is an Admin in the database
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
    console.error('Admin Stats Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin stats',
      details: error.message,
      path: req.originalUrl
    });
  }
});

module.exports = router;