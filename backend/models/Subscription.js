const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  category: { type: String, default: 'entertainment' },
  nextDue: { type: Date },
  active: { type: Boolean, default: true },
  detectedFromTx: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  icon: { type: String, default: '🔄' },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
