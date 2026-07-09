const mongoose = require('mongoose');

const collateralSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  
  // Item details
  itemName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['electronics', 'jewelry', 'vehicle', 'real-estate', 'other'],
    required: true
  },
  description: { type: String },
  condition: { type: String, enum: ['new', 'good', 'fair', 'poor'], default: 'good' },
  
  // Valuation
  estimatedValue: { type: Number, required: true },
  appraiserVerified: { type: Boolean, default: false },
  appraiserName: String,
  appraisalDate: Date,
  
  // Images and documentation
  images: [{ type: String }], // URLs to images
  documents: [{ type: String }], // URLs to certificates, receipts, etc.
  
  // Status
  status: {
    type: String,
    enum: ['available', 'pledged', 'released', 'forfeited'],
    default: 'available'
  },
  
  // Location info
  storageLocation: {
    description: String,
    address: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Collateral', collateralSchema);
