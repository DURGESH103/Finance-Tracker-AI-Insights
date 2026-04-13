const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['cash', 'bank', 'wallet', 'credit'], default: 'bank' },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, select: false },
  avatar: { type: String },
  googleId: { type: String, index: true, sparse: true },
  accounts: [accountSchema],
  monthlyBudget: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  refreshToken: { type: String, select: false },
  refreshTokenExpiry: { type: Date, select: false },
  lastLoginAt: { type: Date },
  loginCount: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

userSchema.methods.generateRefreshToken = function () {
  const token = crypto.randomBytes(40).toString('hex');
  this.refreshToken = crypto.createHash('sha256').update(token).digest('hex');
  this.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token; // return raw token to send to client
};

module.exports = mongoose.model('User', userSchema);
