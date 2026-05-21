const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['privacy_policy', 'terms_conditions', 'contact_info'],
    unique: true,
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  lastUpdatedBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteContent', siteContentSchema);
