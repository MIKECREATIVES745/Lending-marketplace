const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  category: {
    type: String,
    enum: ['academic', 'design', 'coding', 'delivery', 'manual-labor', 'other'],
    required: true
  },
  location: {
    lat: { type: Number, default: -15.3941 }, // Default to UNZA
    lng: { type: Number, default: 28.3297 },
    address: { type: String, default: 'UNZA Main Campus' }
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled', 'payment-pending'],
    default: 'open'
  },
  assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escrowStatus: {
    type: String,
    enum: ['none', 'held', 'released', 'disputed'],
    default: 'none'
  },
  posterConfirmation: { type: Boolean, default: false },
  workerConfirmation: { type: Boolean, default: false },
  deadline: { type: Date },
  applicants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    appliedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gig', gigSchema);
