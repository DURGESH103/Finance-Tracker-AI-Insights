const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Gamification = require('../models/Gamification');
const { categorizeWithAI } = require('../services/aiService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ── Gamification helpers ─────────────────────────────────────────────────────
const updateStreakAndPoints = async (userId, session) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const gam = await Gamification.findOne({ userId }).session(session);

  if (!gam) {
    await Gamification.create([{ userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today, points: 10 }], { session });
    return;
  }

  const last = gam.lastActiveDate ? new Date(gam.lastActiveDate) : null;
  if (last) last.setHours(0, 0, 0, 0);

  // Already updated today — just add points
  if (last && last.getTime() === today.getTime()) {
    await Gamification.findOneAndUpdate({ userId }, { $inc: { points: 10 } }, { session });
    return;
  }

  const newStreak = (last && last.getTime() === yesterday.getTime()) ? gam.currentStreak + 1 : 1;
  const newBadges = [];
  if (newStreak === 7 && !gam.earnedBadges.find((b) => b.badgeId === 'streak_7')) newBadges.push('streak_7');
  if (newStreak === 30 && !gam.earnedBadges.find((b) => b.badgeId === 'streak_30')) newBadges.push('streak_30');

  const update = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, gam.longestStreak),
    lastActiveDate: today,
    $inc: { points: 10 },
  };
  if (newBadges.length) {
    update.$push = { earnedBadges: { $each: newBadges.map((b) => ({ badgeId: b, earnedAt: new Date() })) } };
  }
  await Gamification.findOneAndUpdate({ userId }, update, { session });
};

// ── CREATE — atomic: transaction + budget + gamification ────────────────────
exports.create = asyncHandler(async (req, res) => {
  const { amount, type, category, description, date, accountId, tags } = req.body;
  const io = req.app.get('io');
  const userId = req.user._id;

  // AI categorization (outside session — network call)
  let finalCategory = category;
  if (!category || category === 'other') {
    finalCategory = await categorizeWithAI(description) || 'other';
  }

  const session = await mongoose.startSession();
  let tx;

  try {
    await session.withTransaction(async () => {
      // 1. Create transaction
      [tx] = await Transaction.create([{
        userId, accountId, amount, type,
        category: finalCategory,
        description, tags,
        date: date || new Date(),
        aiCategorized: !category || category === 'other',
      }], { session });

      // 2. Update budget + fire alert
      if (type === 'expense') {
        const txDate = new Date(tx.date);
        const budget = await Budget.findOneAndUpdate(
          { userId, category: finalCategory, month: txDate.getMonth() + 1, year: txDate.getFullYear() },
          { $inc: { spent: amount } },
          { new: true, session }
        );

        if (budget) {
          const pct = (budget.spent / budget.limit) * 100;
          if (!budget.alertSent && pct >= 100) {
            io?.to(userId.toString()).emit('budget:critical', {
              message: `🚨 ${finalCategory} budget exceeded!`,
              category: finalCategory, spent: budget.spent, limit: budget.limit,
            });
            await Budget.findByIdAndUpdate(budget._id, { alertSent: true }, { session });
          } else if (pct >= 80 && pct < 100) {
            io?.to(userId.toString()).emit('budget:warning', {
              message: `⚠️ ${finalCategory} budget at ${pct.toFixed(0)}%`,
              category: finalCategory, spent: budget.spent, limit: budget.limit,
            });
          }
        }
      }

      // 3. Gamification — atomic with same session
      await updateStreakAndPoints(userId, session);

      // First transaction badge
      const txCount = await Transaction.countDocuments({ userId }).session(session);
      if (txCount === 1) {
        await Gamification.findOneAndUpdate(
          { userId },
          { $push: { earnedBadges: { badgeId: 'first_transaction', earnedAt: new Date() } }, $inc: { points: 50 } },
          { upsert: true, session }
        );
      }
    });
  } finally {
    session.endSession();
  }

  logger.audit(userId, 'TRANSACTION_CREATED', { txId: tx._id, amount, type, category: finalCategory });
  io?.to(userId.toString()).emit('transaction:new', tx);

  res.status(201).json({ success: true, data: tx });
});

// ── READ ─────────────────────────────────────────────────────────────────────
exports.getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, category, startDate, endDate, search } = req.query;
  const filter = { userId: req.user._id };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) filter.description = { $regex: search, $options: 'i' };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ date: -1 }).skip((+page - 1) * +limit).limit(+limit).lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({ success: true, data: { transactions, total, pages: Math.ceil(total / +limit), page: +page } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!tx) throw new AppError('Transaction not found', 404);
  res.json({ success: true, data: tx });
});

exports.update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true, runValidators: true }
  );
  if (!tx) throw new AppError('Transaction not found', 404);
  logger.audit(req.user._id, 'TRANSACTION_UPDATED', { txId: tx._id });
  res.json({ success: true, data: tx });
});

exports.remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!tx) throw new AppError('Transaction not found', 404);
  logger.audit(req.user._id, 'TRANSACTION_DELETED', { txId: tx._id, amount: tx.amount });
  res.json({ success: true, message: 'Deleted' });
});

// ── ANALYTICS — single optimised aggregation pipeline ───────────────────────
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Single aggregation with $facet — one round-trip to MongoDB
  const [result] = await Transaction.aggregate([
    { $match: { userId, date: { $gte: sixMonthsAgo } } },
    {
      $facet: {
        categoryBreakdown: [
          { $match: { type: 'expense', date: { $gte: startOfMonth } } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        monthlyTrend: [
          { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],
        currentMonthSummary: [
          { $match: { date: { $gte: startOfMonth } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ],
        lastMonthSummary: [
          { $match: { date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ],
        cashFlow: [
          { $match: { date: { $gte: startOfMonth } } },
          { $group: { _id: { day: { $dayOfMonth: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
          { $sort: { '_id.day': 1 } },
        ],
        activityHeatmap: [
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 }, total: { $sum: '$amount' } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  res.json({ success: true, data: result });
});

// ── NET WORTH — cumulative aggregation ───────────────────────────────────────
exports.getNetWorth = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthly = await Transaction.aggregate([
    { $match: { userId, date: { $gte: twelveMonthsAgo } } },
    { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const map = {};
  monthly.forEach(({ _id, total }) => {
    const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
    map[key][_id.type] = total;
  });

  let cumulative = 0;
  const netWorthHistory = Object.values(map).map((m) => {
    cumulative += m.income - m.expense;
    return { month: m.month, netWorth: Math.round(cumulative), income: m.income, expense: m.expense };
  });

  res.json({ success: true, data: { netWorthHistory, currentNetWorth: Math.round(cumulative) } });
});
