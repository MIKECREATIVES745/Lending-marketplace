const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const initCleanupTask = require('./routes/cleanup');

// Robust .env loading
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✓ Environment variables loaded from:', envPath);
} else {
  console.warn('! Warning: .env file not found at:', envPath);
}

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

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
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('X Error: MONGODB_URI is not defined in your .env file.');
  console.log('Please ensure c:\\Users\\Mutale\\LendingMarketplace\\backend\\.env exists and contains your connection string.');
} else {
  const isCloud = mongoURI.includes('mongodb.net');
  console.log(`ℹ Information: Using ${isCloud ? 'Cloud (Atlas)' : 'Local'} connection string`);
  
  // Log masked URI for verification
  console.log(`✓ Attempting connection to: ${mongoURI.replace(/:([^:@]+)@/, ':****@')}`);
}

mongoose.set('strictQuery', false);

// Only attempt connection if URI exists
if (mongoURI) {
  mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000, // Fail fast if connection cannot be established
  connectTimeoutMS: 10000
  })
  .then(() => console.log('✓ MongoDB connection successful'))
  .catch(err => {
    console.error('X MongoDB error:', err.message);
    if (err.message.includes('ECONNREFUSED') && (err.message.includes('127.0.0.1') || err.message.includes('localhost'))) {
      console.log('! Solution: Your app is trying to connect to a LOCAL database that isn\'t running.');
      console.log('! Action: Ensure your .env MONGODB_URI contains your Atlas connection string.');
    } else if (err.message.includes('querySrv ECONNREFUSED')) {
      console.log('! Network Issue: Your DNS provider or firewall is blocking MongoDB SRV records.');
      console.log('! Solution: Use the "Standard Connection String" (long format) from Atlas in your .env file.');
      console.log('! Link: https://www.mongodb.com/docs/atlas/troubleshoot-connection/#special-characters-in-connection-string');
    } else if (err.name === 'MongooseServerSelectionError') {
      console.log('! Connection Error: Could not reach the cluster. Verify that your IP address is whitelisted in the MongoDB Atlas "Network Access" settings.');
    }
  });
}

// Start background tasks
initCleanupTask();

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
app.use('/api/lending', require('./routes/lending'));
app.use('/api/sitecontent', require('./routes/sitecontent'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/complaints', require('./routes/complaints'));

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
