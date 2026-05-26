const express = require('express');
const auth = require('../middleware/auth');
const { Message, Conversation } = require('../models/Message');
const router = express.Router();

// Get conversations for a user
router.get('/conversations/:userId', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const conversations = await Conversation.find({
      participantIds: req.userId
    })
      .populate('participantIds', 'firstName lastName profileImage')
      .populate({ path: 'lastMessage', select: 'message createdAt senderId' })
      .sort({ lastMessageTime: -1 });
    
    // Map conversations to include unread indicators for the UI
    const conversationsWithMeta = conversations.map(conv => {
      const plainConv = conv.toObject();
      // If last message is from someone else, mark it as a pending unread for the badge
      plainConv.unreadCount = (plainConv.lastMessage && String(plainConv.lastMessage.senderId) !== String(req.userId)) ? 1 : 0;
      return plainConv;
    });

    res.json(conversationsWithMeta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages in a conversation
router.get('/messages/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    const participantIds = conversation?.participantIds?.map(id => id.toString()) || [];
    if (!conversation || !participantIds.includes(req.userId.toString())) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await Message.find({ 
      conversationId: req.params.conversationId 
    })
      .populate('senderId', 'firstName lastName profileImage')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or get conversation
router.post('/conversation', auth, async (req, res) => {
  try {
    const { partnerId, loanId } = req.body;
    if (!partnerId) {
      return res.status(400).json({ error: 'partnerId is required' });
    }

    if (partnerId === req.userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    let conversation = await Conversation.findOne({
      participantIds: { $all: [req.userId, partnerId] }
    })
      .populate('participantIds', 'firstName lastName profileImage')
      .populate({ path: 'lastMessage', select: 'message createdAt senderId' });

    if (!conversation) {
      conversation = new Conversation({
        participantIds: [req.userId, partnerId],
        relatedLoanId: loanId
      });
      await conversation.save();
      conversation = await Conversation.findById(conversation._id)
        .populate('participantIds', 'firstName lastName profileImage')
        .populate({ path: 'lastMessage', select: 'message createdAt senderId' });
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/message', auth, async (req, res) => {
  try {
    const { conversationId, recipientId, message, loanId } = req.body;
    const senderId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participantIds.includes(senderId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

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
        lastMessageTime: new Date(),
        updatedAt: new Date()
      }
    );

    // Emit real-time notification and message event
    const { io } = require('../index');
    if (io) {
      // Notify recipient of new message
      io.to(recipientId.toString()).emit('new-message', {
        conversationId,
        message: newMessage
      });

      // Trigger general notification for the navbar count
      io.to(recipientId.toString()).emit('notification', {
        type: 'NEW_MESSAGE',
        title: 'New Chat Message',
        message: 'You have received a new message in your inbox',
        conversationId,
        senderId,
        timestamp: new Date()
      });
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
