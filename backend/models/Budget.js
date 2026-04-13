const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  period: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
  month: { type: Number },
  year: { type: Number },
  alertSent: { type: Boolean, default: false },
}, { timestamps: true });

budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
