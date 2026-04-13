const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['cash', 'bank', 'wallet', 'credit'], default: 'bank' },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  avatar: { type: String },
  googleId: { type: String },
  accounts: [accountSchema],
  monthlyBudget: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
