const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  category: { type: String, default: 'savings' },
  icon: { type: String, default: '🎯' },
  completed: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
  lastContribution: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
