const mongoose = require('mongoose');
const Insight = require('../models/Insight');
const FinancialScore = require('../models/FinancialScore');
const Gamification = require('../models/Gamification');
const {
  generateInsights, predictNextMonth, chatWithAssistant,
  calculateHealthScore, analyzeSpendingPatterns,
} = require('../services/aiService');
const { analyzePortfolio } = require('../services/investmentService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.getInsights = asyncHandler(async (req, res) => {
  const insights = await Insight.find({ userId: req.user._id })
    .sort({ createdAt: -1 }).limit(10).lean();
  res.json({ success: true, data: insights });
});

exports.refreshInsights = asyncHandler(async (req, res) => {
  const raw = await generateInsights(req.user._id);
  if (!raw.length) return res.json({ success: true, data: [] });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const userId = req.user._id;

  // Atomic: delete today's insights and insert new ones in one transaction
  const session = await mongoose.startSession();
  let insights;
  try {
    await session.withTransaction(async () => {
      await Insight.deleteMany({ userId, createdAt: { $gte: today } }, { session });
      insights = await Insight.insertMany(
        raw.map((i) => ({ ...i, userId })),
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  // Gamification — outside transaction (non-critical, best-effort)
  const gam = await Gamification.findOneAndUpdate(
    { userId },
    { $inc: { insightRefreshCount: 1, points: 5 } },
    { upsert: true, new: true }
  );
  if (gam.insightRefreshCount >= 5 && !gam.earnedBadges.find((b) => b.badgeId === 'ai_insight')) {
    await Gamification.findOneAndUpdate(
      { userId },
      { $push: { earnedBadges: { badgeId: 'ai_insight', earnedAt: new Date() } } }
    );
  }

  logger.audit(userId, 'INSIGHTS_REFRESHED', { count: insights.length });
  res.json({ success: true, data: insights });
});

exports.getPrediction = asyncHandler(async (req, res) => {
  const prediction = await predictNextMonth(req.user._id);
  res.json({ success: true, data: { predictedAmount: prediction } });
});

exports.chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  const reply = await chatWithAssistant(req.user._id, message, history);
  logger.audit(req.user._id, 'AI_CHAT', { messageLength: message.length });
  res.json({ success: true, data: { reply } });
});

exports.markRead = asyncHandler(async (req, res) => {
  await Insight.updateMany({ userId: req.user._id }, { read: true });
  res.json({ success: true, message: 'Marked as read' });
});

exports.getHealthScore = asyncHandler(async (req, res) => {
  const now = new Date();
  const userId = req.user._id;

  const cached = await FinancialScore.findOne({
    userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  // Serve cache if fresher than 1 hour
  if (cached && (Date.now() - cached.updatedAt.getTime()) < 3_600_000) {
    return res.json({ success: true, data: cached });
  }

  const result = await calculateHealthScore(userId);
  const score = await FinancialScore.findOneAndUpdate(
    { userId, month: now.getMonth() + 1, year: now.getFullYear() },
    { ...result, month: now.getMonth() + 1, year: now.getFullYear() },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: score });
});

exports.getSpendingPatterns = asyncHandler(async (req, res) => {
  const patterns = await analyzeSpendingPatterns(req.user._id);
  res.json({ success: true, data: patterns });
});

exports.getGamification = asyncHandler(async (req, res) => {
  const gam = await Gamification.findOne({ userId: req.user._id }).lean();
  const allBadges = Gamification.BADGES;
  res.json({
    success: true,
    data: {
      ...(gam || { points: 0, currentStreak: 0, longestStreak: 0, earnedBadges: [] }),
      allBadges,
      level: gam ? Math.floor(gam.points / 100) + 1 : 1,
    },
  });
});

exports.getPortfolioIntelligence = asyncHandler(async (req, res) => {
  const analysis = await analyzePortfolio(req.user._id);
  res.json({ success: true, data: analysis });
});
