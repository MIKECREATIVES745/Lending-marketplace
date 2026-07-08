const express = require('express');
const Ad = require('../models/Ad');
const auth = require('../middleware/auth');
const User = require('../models/User');
const upload = process.env.CLOUDINARY_CLOUD_NAME
  ? require('../middleware/cloudinary')
  : require('../middleware/upload');
const router = express.Router();

// Admin: Get all ads
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) return res.status(403).json({ error: 'Access denied' });
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active ads for users
router.get('/active', async (req, res) => {
  try {
    const { placement } = req.query;
    const query = { isActive: true };
    if (placement) query.placement = placement;
    
    const ads = await Ad.find(query);
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create Ad
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) return res.status(403).json({ error: 'Access denied' });

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const placement = ['sidebar', 'top', 'bottom', 'popup', 'gig-board-top', 'marketplace-sidebar', 'dashboard-banner'].includes(req.body.placement)
      ? req.body.placement
      : 'gig-board-top';

    const targetUrl = req.body.targetUrl || req.body.linkUrl || '';

    const ad = new Ad({
      title: req.body.title || 'Untitled Ad',
      targetUrl,
      placement,
      imageUrl: req.file.path || req.file.secure_url,
      isActive: true
    });

    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete Ad
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) return res.status(403).json({ error: 'Access denied' });

    await Ad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;