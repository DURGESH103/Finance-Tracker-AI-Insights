const mongoose = require('mongoose');

const BADGES = [
  { id: 'first_transaction', label: 'First Step', icon: '🚀', desc: 'Added your first transaction' },
  { id: 'budget_master', label: 'Budget Master', icon: '🎯', desc: 'Stayed under budget for a full month' },
  { id: 'saver_100k', label: 'Super Saver', icon: '💰', desc: 'Saved ₹1,00,000 total' },
  { id: 'streak_7', label: 'Week Warrior', icon: '🔥', desc: '7-day tracking streak' },
  { id: 'streak_30', label: 'Monthly Master', icon: '⚡', desc: '30-day tracking streak' },
  { id: 'goal_complete', label: 'Goal Getter', icon: '🏆', desc: 'Completed a savings goal' },
  { id: 'ai_insight', label: 'AI Explorer', icon: '🤖', desc: 'Generated AI insights 5 times' },
  { id: 'no_splurge', label: 'Disciplined', icon: '🧘', desc: 'No entertainment spend for 2 weeks' },
];

const gamificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  earnedBadges: [{ badgeId: String, earnedAt: Date }],
  insightRefreshCount: { type: Number, default: 0 },
}, { timestamps: true });

gamificationSchema.statics.BADGES = BADGES;

module.exports = mongoose.model('Gamification', gamificationSchema);
