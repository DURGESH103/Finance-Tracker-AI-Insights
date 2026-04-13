const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const sendTokens = async (user, res, statusCode = 200) => {
  const accessToken = user.generateAccessToken();
  const rawRefresh = user.generateRefreshToken();

  user.lastLoginAt = new Date();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', rawRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency,
      theme: user.theme,
    },
  });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already registered', 409);

  const user = await User.create({
    name, email, password,
    accounts: [{ name: 'Primary Bank', type: 'bank', balance: 0 }],
  });

  logger.audit(user._id, 'USER_REGISTERED', { email });
  await sendTokens(user, res, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken +refreshTokenExpiry');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid credentials', 401);
  }

  logger.audit(user._id, 'USER_LOGIN', { email });
  await sendTokens(user, res);
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (!raw) throw new AppError('No refresh token', 401);

  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  const user = await User.findOne({
    refreshToken: hashed,
    refreshTokenExpiry: { $gt: new Date() },
  }).select('+refreshToken +refreshTokenExpiry');

  if (!user) throw new AppError('Refresh token invalid or expired', 401);

  logger.audit(user._id, 'TOKEN_REFRESHED');
  await sendTokens(user, res);
});

// Logout works even with an expired access token — uses refresh cookie
exports.logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.refreshToken;

  if (raw) {
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    await User.findOneAndUpdate(
      { refreshToken: hashed },
      { refreshToken: null, refreshTokenExpiry: null }
    );
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  logger.audit(req.user?._id ?? 'unknown', 'USER_LOGOUT');
  res.json({ success: true, message: 'Logged out' });
});

exports.googleAuth = asyncHandler(async (req, res) => {
  const { googleId, email, name, avatar } = req.body;
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      googleId, email, name, avatar,
      accounts: [{ name: 'Primary Bank', type: 'bank', balance: 0 }],
    });
    logger.audit(user._id, 'USER_REGISTERED_GOOGLE', { email });
  } else if (!user.googleId) {
    user.googleId = googleId;
    await user.save({ validateBeforeSave: false });
  }

  await sendTokens(user, res);
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
