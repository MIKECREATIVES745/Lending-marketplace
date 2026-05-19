const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get lenders for marketplace
router.get('/lenders/list', async (req, res) => {
  try {
    const lenders = await User.find({ 
      userType: { $in: ['lender', 'both'] },
      verified: true 
    }).select('-password -bankDetails');
    res.json(lenders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get gig workers
router.get('/workers/list', async (req, res) => {
  try {
    const workers = await User.find({
      isGigWorker: true
    }).select('-password -bankDetails');
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
