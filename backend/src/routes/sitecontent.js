const express = require('express');
const SiteContent = require('../models/SiteContent');
const router = express.Router();

// Get all site content
router.get('/', async (req, res) => {
  try {
    const content = await SiteContent.find({});
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific content by type
router.get('/:contentType', async (req, res) => {
  try {
    const content = await SiteContent.findOne({ contentType: req.params.contentType });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update site content
router.put('/:contentType', async (req, res) => {
  try {
    const { title, content, lastUpdatedBy } = req.body;
    
    let siteContent = await SiteContent.findOne({ contentType: req.params.contentType });
    
    if (!siteContent) {
      siteContent = new SiteContent({
        contentType: req.params.contentType,
        title,
        content,
        lastUpdatedBy
      });
    } else {
      siteContent.title = title || siteContent.title;
      siteContent.content = content || siteContent.content;
      siteContent.lastUpdatedBy = lastUpdatedBy || siteContent.lastUpdatedBy;
      siteContent.updatedAt = new Date();
    }
    
    await siteContent.save();
    res.json(siteContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
