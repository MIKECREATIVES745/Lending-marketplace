const express = require('express');
const Collateral = require('../models/Collateral');
const router = express.Router();

// Add collateral
router.post('/', async (req, res) => {
  try {
    const { userId, itemName, category, estimatedValue, description } = req.body;
    
    const collateral = new Collateral({
      userId,
      itemName,
      category,
      estimatedValue,
      description
    });
    
    await collateral.save();
    res.status(201).json(collateral);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's collateral
router.get('/user/:userId', async (req, res) => {
  try {
    const collateral = await Collateral.find({ userId: req.params.userId });
    res.json(collateral);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update collateral
router.put('/:id', async (req, res) => {
  try {
    const collateral = await Collateral.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(collateral);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete collateral
router.delete('/:id', async (req, res) => {
  try {
    await Collateral.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collateral deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
