const mongoose = require('mongoose');

const lendingOfferSchema = new mongoose.Schema({
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lenderName: {
    type: String,
    required: true
  },
  lenderEmail: {
    type: String,
    required: true
  },
  lenderPhone: {
    type: String
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  loanTerm: {
    type: Number,
    required: true,
    help: 'Loan term in months'
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  lenderDetails: {
    businessName: String,
    businessType: String,
    yearsInBusiness: Number,
    verification: String
  },
  
  terms: {
    acceptsCollateral: Boolean,
    requiresCreditScore: Number,
    requiresGuarantor: Boolean
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  
  acceptedApplications: [
    {
      borrowerId: mongoose.Schema.Types.ObjectId,
      status: String,
      appliedAt: Date
    }
  ],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LendingOffer', lendingOfferSchema);
