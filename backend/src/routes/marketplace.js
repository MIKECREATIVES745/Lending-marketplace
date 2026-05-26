const express = require('express');
const Loan = require('../models/Loan');
const User = require('../models/User');
const LendingOffer = require('../models/LendingOffer');
const router = express.Router();

// Get available loans for lending
router.get('/available-loans', async (req, res) => {
  try {
    const { minAmount, maxAmount, interestRate, status = 'pending' } = req.query;
    
    let query = { status };
    
    if (minAmount) query.amount = { $gte: parseInt(minAmount) };
    if (maxAmount) {
      query.amount = query.amount ? { ...query.amount, $lte: parseInt(maxAmount) } : { $lte: parseInt(maxAmount) };
    }
    if (interestRate) query.interestRate = { $gte: parseInt(interestRate) };
    
    const loans = await Loan.find(query)
      .populate('borrowerId', 'firstName lastName creditScore successfulPayments')
      .sort({ createdAt: -1 });
    
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available lenders
router.get('/available-lenders', async (req, res) => {
  try {
    // Find all active lending offers from verified lenders
    const offers = await LendingOffer.find({ status: 'active' })
      .populate({
        path: 'lenderId',
        match: { isEmailVerified: true },
        select: 'firstName lastName profileImage creditScore address'
      })
      .sort({ createdAt: -1 });
    
    // Filter out offers where the lender didn't match the verification filter
    res.json(offers.filter(offer => offer.lenderId !== null));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lender details
router.get('/lenders/:id', async (req, res) => {
  try {
    const lender = await User.findById(req.params.id).select('-password -bankDetails');
    const lentLoans = await Loan.find({ lenderId: req.params.id });
    
    if (!lender) {
      return res.status(404).json({ error: 'Lender not found' });
    }
    
    res.json({
      ...lender.toObject(),
      totalLoansGiven: lentLoans.length,
      successfulLoans: lentLoans.filter(l => l.status === 'completed').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
