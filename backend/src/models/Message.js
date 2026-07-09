const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  message: { type: String, required: true },
  attachments: [{ type: String }], // URLs
  
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  relatedLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  
  createdAt: { type: Date, default: Date.now },
  readAt: Date
});

const conversationSchema = new mongoose.Schema({
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: mongoose.Schema.Types.ObjectId,
  lastMessageTime: Date,
  relatedLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  Message: mongoose.model('Message', messageSchema),
  Conversation: mongoose.model('Conversation', conversationSchema)
};
