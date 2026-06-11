const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  targetUrl: { type: String, required: true }, // Where the ad links to
  placement: { 
    type: String, 
    enum: ['gig-board-top', 'marketplace-sidebar', 'dashboard-banner'],
    default: 'gig-board-top' 
  },
  isActive: { type: Boolean, default: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  expiryDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ad', AdSchema);