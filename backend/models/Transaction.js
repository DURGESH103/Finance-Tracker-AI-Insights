const mongoose = require('mongoose');

const CATEGORIES = [
  'food', 'transport', 'shopping', 'entertainment', 'health',
  'rent', 'utilities', 'travel', 'education', 'salary',
  'freelance', 'investment', 'other'
];

const transactionSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountId:     { type: mongoose.Schema.Types.ObjectId },
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ['income', 'expense'], required: true },
  category:      { type: String, enum: CATEGORIES, default: 'other' },
  description:   { type: String, trim: true },
  date:          { type: Date, default: Date.now },
  aiCategorized: { type: Boolean, default: false },
  tags:          [String],
}, { timestamps: true });

// Primary list query: userId + date desc (pagination, history)
transactionSchema.index({ userId: 1, date: -1 });

// Analytics / risk: filter by userId + date range + type in one pass
transactionSchema.index({ userId: 1, type: 1, date: -1 });

// Category breakdown queries
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Subscription detection: distinct userId + date range
transactionSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
