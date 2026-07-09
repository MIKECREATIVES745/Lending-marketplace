const express = require('express');
const router = express.Router();
const LendingOffer = require('../models/LendingOffer');
const auth = require('../middleware/auth');

// @desc    Get all lending offers for the logged-in lender
router.get('/my-offers', auth, async (req, res) => {
  try {
    const offers = await LendingOffer.find({ lenderId: req.userId });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create a new lending offer
router.post('/', auth, async (req, res) => {
  try {
    const { amount, interestRate, loanTerm, description, lenderDetails, terms } = req.body;

    if (!amount || amount <= 100) {
      return res.status(400).json({ error: 'Lending amount must be greater than 100' });
    }

    const newOffer = new LendingOffer({
      lenderId: req.userId,
      amount,
      interestRate,
      loanTerm,
      description,
      lenderDetails,
      terms,
      status: 'active'
    });

    await newOffer.save();
    res.status(201).json(newOffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update a lending offer
router.put('/:id', auth, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    if (offer.lenderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedOffer = await LendingOffer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete a lending offer
router.delete('/:id', auth, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    if (offer.lenderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await LendingOffer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offer removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;