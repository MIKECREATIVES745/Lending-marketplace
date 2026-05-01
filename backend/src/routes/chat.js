const express = require('express');
const { Message, Conversation } = require('../models/Message');
const router = express.Router();

// Get conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participantIds: req.params.userId
    }).populate('participantIds', 'firstName lastName profileImage')
      .sort({ lastMessageTime: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages in a conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversationId: req.params.conversationId 
    }).populate('senderId', 'firstName lastName profileImage')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or get conversation
router.post('/conversation', async (req, res) => {
  try {
    const { userId1, userId2, loanId } = req.body;
    
    let conversation = await Conversation.findOne({
      $and: [
        { participantIds: { $in: [userId1] } },
        { participantIds: { $in: [userId2] } }
      ]
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participantIds: [userId1, userId2],
        relatedLoanId: loanId
      });
      await conversation.save();
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/message', async (req, res) => {
  try {
    const { conversationId, senderId, recipientId, message, loanId } = req.body;
    
    const newMessage = new Message({
      conversationId,
      senderId,
      recipientId,
      message,
      relatedLoanId: loanId
    });
    
    await newMessage.save();
    
    // Update conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: newMessage._id,
        lastMessageTime: new Date()
      }
    );
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
