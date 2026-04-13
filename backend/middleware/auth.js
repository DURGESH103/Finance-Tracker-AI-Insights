const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

// Inject correlation ID on every request for log tracing
const correlationId = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) return next(new AppError('Not authorized — no token', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) return next(new AppError('User not found', 401));

    req.user = user;
    logger.debug('Auth OK', { userId: user._id, path: req.path, correlationId: req.correlationId });
    next();
  } catch (err) {
    next(new AppError('Token invalid or expired', 401));
  }
};

module.exports = { protect, correlationId };
