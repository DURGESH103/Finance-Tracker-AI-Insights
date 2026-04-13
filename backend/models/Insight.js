const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['warning', 'tip', 'prediction', 'summary'], default: 'tip' },
  title: { type: String, required: true },
  text: { type: String, required: true },
  category: { type: String },
  savingsAmount: { type: Number },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);
