const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { type: String, unique: true },
  borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Loan details
  amount: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  interestRate: { type: Number, required: true }, // APR percentage
  loanTerm: { type: Number, required: true }, // in days
  paymentPeriod: { type: Number, required: true }, // in days
  
  // Collateral
  collateralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collateral' },
  collateralValue: { type: Number, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed', 'defaulted', 'cancelled'],
    default: 'pending'
  },
  
  // Purpose
  purpose: { type: String },
  description: { type: String },
  
  // Payment tracking
  payments: [{
    amount: Number,
    dueDate: Date,
    paidDate: Date,
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' }
  }],
  
  // Health indicators
  healthRatio: { type: Number, default: 100 }, // percentage
  totalRepaid: { type: Number, default: 0 },
  remainingBalance: { type: Number },
  
  // QR Code for in-person verification
  qrCode: { type: String }, // Base64 encoded QR code image
  verificationCode: { type: String, unique: true }, // Unique code for verification
  exchangeVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  
  // Dates
  createdAt: { type: Date, default: Date.now },
  startDate: Date,
  expectedCompletionDate: Date,
  completedAt: Date
});

module.exports = mongoose.model('Loan', loanSchema);
