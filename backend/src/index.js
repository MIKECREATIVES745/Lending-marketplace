const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lending-unza')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.log('✗ MongoDB error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/collateral', require('./routes/collateral'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/gigs', require('./routes/gigs'));

// Socket.io for real-time chat and notifications
io.on('connection', (socket) => {
  console.log('✓ User connected:', socket.id);

  // Join a private room based on user ID for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(userId);
    console.log(`✓ User ${userId} joined their private room`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('send-message', (message, roomId) => {
    io.to(roomId).emit('receive-message', {
      userId: socket.id,
      message,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('✗ User disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('✓ API ready at http://localhost:' + PORT + '/api');
});

module.exports = { app, io };
