const express = require('express');
const Gig = require('../models/Gig');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all open gigs
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { status: 'open' };
    if (category) query.category = category;

    const gigs = await Gig.find(query)
      .populate('posterId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new gig
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, budget, category, deadline, location } = req.body;
    const gig = new Gig({
      posterId: req.userId,
      title,
      description,
      budget,
      category,
      deadline,
      location: location || {
        lat: -15.3941,
        lng: 28.3297,
        address: 'UNZA Main Campus'
      }
    });
    await gig.save();
    res.status(201).json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for a gig
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const gig = await Gig.findById(req.params.id);

    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    // Check if already applied
    const alreadyApplied = gig.applicants.some(app => app.userId.toString() === req.userId);
    if (alreadyApplied) return res.status(400).json({ error: 'Already applied for this gig' });

    gig.applicants.push({ userId: req.userId, message });
    await gig.save();

    // Emit notification to the gig poster
    const { io } = require('../index');
    if (io) {
      io.to(gig.posterId.toString()).emit('notification', {
        type: 'GIG_APPLICATION',
        title: 'New Gig Application',
        message: `Someone applied for your gig: ${gig.title}`,
        gigId: gig._id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's posted gigs
router.get('/my-posts', auth, async (req, res) => {
  try {
    const gigs = await Gig.find({ posterId: req.userId })
      .populate('applicants.userId', 'firstName lastName profileImage')
      .populate('assignedWorkerId', 'firstName lastName profileImage');
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's active jobs (where they are the worker)
router.get('/my-jobs', auth, async (req, res) => {
  try {
    const gigs = await Gig.find({ assignedWorkerId: req.userId })
      .populate('posterId', 'firstName lastName profileImage');
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hire a worker for a gig
router.post('/:id/hire', auth, async (req, res) => {
  try {
    const { workerId } = req.body;
    const gig = await Gig.findById(req.params.id);

    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.posterId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the poster can hire workers' });
    }

    gig.assignedWorkerId = workerId;
    gig.status = 'in-progress';
    gig.escrowStatus = 'held';
    await gig.save();

    // Notify the worker
    const { io } = require('../index');
    if (io) {
      io.to(workerId).emit('notification', {
        type: 'GIG_HIRED',
        title: 'You have been hired!',
        message: `You were hired for the gig: ${gig.title}`,
        gigId: gig._id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Worker hired and escrow initiated', gig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm completion (Worker or Poster)
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    if (req.userId === gig.posterId.toString()) {
      gig.posterConfirmation = true;
    } else if (req.userId === gig.assignedWorkerId.toString()) {
      gig.workerConfirmation = true;
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If both confirmed, release escrow
    if (gig.posterConfirmation && gig.workerConfirmation) {
      gig.status = 'completed';
      gig.escrowStatus = 'released';

      // Update worker and poster financial stats (simplified)
      const User = require('../models/User');
      await User.findByIdAndUpdate(gig.assignedWorkerId, { $inc: { successfulPayments: 1 } });
    } else if (gig.workerConfirmation && !gig.posterConfirmation) {
      gig.status = 'payment-pending';
    }

    await gig.save();

    // Notify the other party
    const recipientId = req.userId === gig.posterId.toString() ? gig.assignedWorkerId : gig.posterId;
    const { io } = require('../index');
    if (io) {
      io.to(recipientId.toString()).emit('notification', {
        type: 'GIG_CONFIRMATION',
        title: 'Gig Status Update',
        message: `Status updated for: ${gig.title}`,
        gigId: gig._id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Confirmation recorded', gig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
