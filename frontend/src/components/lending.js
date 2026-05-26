const express = require('express');
const router = express.Router();
const LendingOffer = require('../models/LendingOffer');
const { protect } = require('../middleware/auth'); // Assuming you have an auth middleware

// @desc    Get all lending offers for the logged-in lender
// @route   GET /api/lending/my-offers
router.get('/my-offers', protect, async (req, res) => {
  try {
    const offers = await LendingOffer.find({ lenderId: req.user._id });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create a new lending offer
// @route   POST /api/lending
router.post('/', protect, async (req, res) => {
  try {
    const { amount, interestRate, loanTerm, description, lenderDetails, terms } = req.body;

    if (!amount || amount <= 100) {
      return res.status(400).json({ error: 'Lending amount must be greater than 100' });
    }

    const newOffer = new LendingOffer({
      lenderId: req.user._id,
      lenderName: `${req.user.firstName} ${req.user.lastName}`,
      amount,
      interestRate,
      loanTerm,
      description,
      lenderDetails,
      terms,
      status: 'active'
    });

    const savedOffer = await newOffer.save();
    res.status(201).json(savedOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Update a lending offer
// @route   PUT /api/lending/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check ownership
    if (offer.lenderId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const updatedOffer = await LendingOffer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Delete a lending offer
// @route   DELETE /api/lending/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const offer = await LendingOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    if (offer.lenderId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await offer.remove();
    res.json({ message: 'Offer removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;