const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  programOfStudy: { type: String },
  computerNumber: { type: String },
  profileImage: { type: String },
  
  // User type: borrower, lender, or both
  userType: { type: String, enum: ['borrower', 'lender', 'both'], default: 'both' },
  
  // KYC and verification
  verified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  kycDocuments: [{ type: String }],
  
  // Financial info
  totalBorrowed: { type: Number, default: 0 },
  totalLent: { type: Number, default: 0 },
  creditScore: { type: Number, default: 500 },
  defaultPayments: { type: Number, default: 0 },
  successfulPayments: { type: Number, default: 0 },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Bank details (encrypted)
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String
  },
  
  // preferences
  preferences: {
    notificationsEnabled: { type: Boolean, default: true },
    currency: { type: String, default: 'ZMW' }
  },

  // Gig Worker Profile
  isGigWorker: { type: Boolean, default: false },
  gigSkills: [{ type: String }],
  gigBio: { type: String },
  gigRating: { type: Number, default: 0 },
  location: {
    lat: { type: Number, default: -15.3941 },
    lng: { type: Number, default: 28.3297 }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
