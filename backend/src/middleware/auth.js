const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization') || req.header('authorization');
  const token = authHeader?.trim()
    ? authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')
      ? authHeader.split(' ').slice(1).join('')
      : authHeader
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
