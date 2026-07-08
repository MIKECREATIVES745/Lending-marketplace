const express = require('express');
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user's complaints (must come BEFORE /:id route)
router.get('/my-complaints', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.userId })
      .populate('relatedGigId', 'title budget')
      .populate('relatedLoanId', 'amount status')
      .populate('relatedUserId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a new complaint
router.post('/', auth, async (req, res) => {
  try {
    const { subject, description, category, relatedGigId, relatedLoanId, relatedUserId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const complaint = new Complaint({
      userId: req.userId,
      subject,
      description,
      category: category || 'other',
      relatedGigId,
      relatedLoanId,
      relatedUserId
    });

    await complaint.save();

    // Populate user info before returning
    await complaint.populate('userId', 'firstName lastName email');

    res.status(201).json({
      message: 'Complaint submitted successfully. We will review it shortly.',
      complaint
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific complaint
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('relatedGigId', 'title budget')
      .populate('relatedLoanId', 'amount status')
      .populate('relatedUserId', 'firstName lastName email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Only user or admin can view the complaint
    if (complaint.userId.toString() !== req.userId && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update complaint status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, adminNotes, resolution } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (status) {
      complaint.status = status;
      if (status === 'resolved') {
        complaint.resolvedAt = new Date();
      }
    }
    if (adminNotes) complaint.adminNotes = adminNotes;
    if (resolution) complaint.resolution = resolution;

    complaint.updatedAt = new Date();
    await complaint.save();

    res.json({
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a complaint (user can only delete their own, within 1 hour)
router.delete('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only allow deletion within 1 hour of creation
    const oneHourAgo = new Date(Date.now() - 3600000);
    if (complaint.createdAt < oneHourAgo) {
      return res.status(400).json({ error: 'Complaints can only be deleted within 1 hour of creation' });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

