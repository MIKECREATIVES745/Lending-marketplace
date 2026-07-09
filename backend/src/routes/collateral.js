const express = require('express');
const Collateral = require('../models/Collateral');
const upload = process.env.CLOUDINARY_CLOUD_NAME
  ? require('../middleware/cloudinary')
  : require('../middleware/upload');
const router = express.Router();

// Add collateral with file uploads
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const { userId, itemName, category, estimatedValue, description, condition } = req.body;
    
    // Build file URLs
    const images = [];
    const documents = [];
    
    if (req.files) {
      req.files.forEach(file => {
        const fileUrl = file.path || `/uploads/${file.filename}`;
        const ext = file.originalname.split('.').pop().toLowerCase();
        
        // Categorize as image or document
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
          images.push(fileUrl);
        } else {
          documents.push(fileUrl);
        }
      });
    }
    
    const collateral = new Collateral({
      userId,
      itemName,
      category,
      estimatedValue,
      description,
      condition: condition || 'good',
      images,
      documents
    });
    
    await collateral.save();
    res.status(201).json({
      ...collateral.toObject(),
      message: 'Collateral created successfully with files uploaded'
    });
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

// Get single collateral
router.get('/:id', async (req, res) => {
  try {
    const collateral = await Collateral.findById(req.params.id);
    if (!collateral) {
      return res.status(404).json({ error: 'Collateral not found' });
    }
    res.json(collateral);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update collateral with optional file uploads
router.put('/:id', upload.array('files', 10), async (req, res) => {
  try {
    const collateral = await Collateral.findById(req.params.id);
    if (!collateral) {
      return res.status(404).json({ error: 'Collateral not found' });
    }

    // Update basic fields
    Object.assign(collateral, req.body);

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileUrl = file.path || `/uploads/${file.filename}`;
        const ext = file.originalname.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
          collateral.images.push(fileUrl);
        } else {
          collateral.documents.push(fileUrl);
        }
      });
    }

    collateral.updatedAt = Date.now();
    await collateral.save();
    res.json({
      ...collateral.toObject(),
      message: 'Collateral updated successfully'
    });
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
