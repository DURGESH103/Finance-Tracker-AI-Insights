const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['stock', 'crypto', 'mutual_fund', 'fd', 'gold', 'other'], required: true },
  symbol: { type: String, uppercase: true },
  units: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  currentPrice: { type: Number },
  buyDate: { type: Date, default: Date.now },
  notes: { type: String },
}, { timestamps: true });

investmentSchema.virtual('currentValue').get(function () {
  return this.units * (this.currentPrice || this.buyPrice);
});
investmentSchema.virtual('investedValue').get(function () {
  return this.units * this.buyPrice;
});
investmentSchema.virtual('pnl').get(function () {
  return this.currentValue - this.investedValue;
});
investmentSchema.virtual('pnlPct').get(function () {
  return this.investedValue ? ((this.pnl / this.investedValue) * 100).toFixed(2) : 0;
});

investmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Investment', investmentSchema);
