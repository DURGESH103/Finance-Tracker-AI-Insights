const mongoose = require('mongoose');

const financialScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number, required: true },          // 0-100
  grade: { type: String },                           // A+, A, B, C, D
  breakdown: {
    savingsRate: Number,
    budgetAdherence: Number,
    expenseConsistency: Number,
    incomeStability: Number,
    goalProgress: Number,
  },
  month: { type: Number },
  year: { type: Number },
}, { timestamps: true });

financialScoreSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('FinancialScore', financialScoreSchema);
