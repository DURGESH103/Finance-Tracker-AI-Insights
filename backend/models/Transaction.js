const mongoose = require('mongoose');

const CATEGORIES = [
  'food', 'transport', 'shopping', 'entertainment', 'health',
  'rent', 'utilities', 'travel', 'education', 'salary',
  'freelance', 'investment', 'other'
];

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, enum: CATEGORIES, default: 'other' },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now, index: true },
  aiCategorized: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
