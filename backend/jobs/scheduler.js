const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const FinancialScore = require('../models/FinancialScore');
const Insight = require('../models/Insight');
const Subscription = require('../models/Subscription');
const { calculateHealthScore, generateInsights, detectSubscriptions } = require('../services/aiService');
const logger = require('../utils/logger');

let io;

// Wrap a cron callback with overlap prevention + top-level error catch
const safeJob = (name, fn) => {
  let running = false;
  return async () => {
    if (running) {
      logger.warn(`[JOB] ${name} skipped — previous run still active`);
      return;
    }
    running = true;
    try {
      await fn();
    } catch (err) {
      logger.error(`[JOB] ${name} crashed`, { error: err.message, stack: err.stack });
    } finally {
      running = false;
    }
  };
};

const getActiveUserIds = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return Transaction.distinct('userId', { date: { $gte: sevenDaysAgo } });
};

// ── Job 1: Recalculate financial health scores — daily at 2 AM ──────────────
const recalculateScores = cron.schedule('0 2 * * *', safeJob('recalculateScores', async () => {
  logger.info('[JOB] Starting daily health score recalculation');
  const userIds = await getActiveUserIds();
  const now = new Date();
  let success = 0;

  for (const userId of userIds) {
    try {
      const result = await calculateHealthScore(userId);
      await FinancialScore.findOneAndUpdate(
        { userId, month: now.getMonth() + 1, year: now.getFullYear() },
        { ...result, month: now.getMonth() + 1, year: now.getFullYear() },
        { upsert: true }
      );
      success++;
    } catch (err) {
      logger.error(`[JOB] Score calc failed for ${userId}`, { error: err.message });
    }
  }
  logger.info(`[JOB] Health scores updated: ${success}/${userIds.length}`);
}), { scheduled: false });

// ── Job 2: Auto-detect subscriptions — daily at 3 AM ────────────────────────
const detectSubscriptionsJob = cron.schedule('0 3 * * *', safeJob('detectSubscriptions', async () => {
  logger.info('[JOB] Starting subscription detection');
  const userIds = await getActiveUserIds();

  for (const userId of userIds) {
    try {
      const detected = await detectSubscriptions(userId);
      if (!detected.length) continue;

      const ops = detected.map((s) => ({
        updateOne: {
          filter: { userId, name: s.name, amount: s.amount },
          update: { $setOnInsert: { ...s, userId } },
          upsert: true,
        },
      }));
      await Subscription.bulkWrite(ops);

      if (io) {
        io.to(userId.toString()).emit('subscription:detected', {
          count: detected.length,
          subscriptions: detected,
        });
      }
    } catch (err) {
      logger.error(`[JOB] Sub detection failed for ${userId}`, { error: err.message });
    }
  }
  logger.info('[JOB] Subscription detection complete');
}), { scheduled: false });

// ── Job 3: Generate AI insights — daily at 4 AM ──────────────────────────────
const generateInsightsJob = cron.schedule('0 4 * * *', safeJob('generateInsights', async () => {
  logger.info('[JOB] Starting AI insight generation');
  const userIds = await getActiveUserIds();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (const userId of userIds) {
    try {
      const existing = await Insight.findOne({ userId, createdAt: { $gte: today } });
      if (existing) continue;

      const raw = await generateInsights(userId);
      if (!raw.length) continue;

      const insights = await Insight.insertMany(raw.map((i) => ({ ...i, userId })));
      if (io) io.to(userId.toString()).emit('ai:insight', { insights });
    } catch (err) {
      logger.error(`[JOB] Insight gen failed for ${userId}`, { error: err.message });
    }
  }
  logger.info('[JOB] AI insight generation complete');
}), { scheduled: false });

// ── Job 4: Budget monitoring — every hour ────────────────────────────────────
const monitorBudgets = cron.schedule('0 * * * *', safeJob('monitorBudgets', async () => {
  const now = new Date();
  const overBudgets = await Budget.find({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    $expr: { $gte: ['$spent', '$limit'] },
    alertSent: false,
  });

  for (const budget of overBudgets) {
    try {
      if (io) {
        io.to(budget.userId.toString()).emit('budget:critical', {
          message: `🚨 ${budget.category} budget exceeded! ₹${budget.spent.toLocaleString()} / ₹${budget.limit.toLocaleString()}`,
          category: budget.category,
          spent: budget.spent,
          limit: budget.limit,
        });
      }
      await Budget.findByIdAndUpdate(budget._id, { alertSent: true });
    } catch (err) {
      logger.error(`[JOB] Budget alert failed for ${budget._id}`, { error: err.message });
    }
  }
}), { scheduled: false });

// ── Job 5: Monthly reset — 1st of each month at midnight ────────────────────
const monthlyReset = cron.schedule('0 0 1 * *', safeJob('monthlyReset', async () => {
  logger.info('[JOB] Monthly reset: resetting budget alertSent flags');
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  await Budget.updateMany({ month: prevMonth, year: prevYear }, { alertSent: false });
  logger.info('[JOB] Monthly reset complete');
}), { scheduled: false });

const init = (socketIo) => {
  io = socketIo;

  if (process.env.NODE_ENV !== 'test') {
    recalculateScores.start();
    detectSubscriptionsJob.start();
    generateInsightsJob.start();
    monitorBudgets.start();
    monthlyReset.start();
    logger.info('✅ Background jobs started (5 jobs)');
  }
};

const stop = () => {
  recalculateScores.stop();
  detectSubscriptionsJob.stop();
  generateInsightsJob.stop();
  monitorBudgets.stop();
  monthlyReset.stop();
  logger.info('Background jobs stopped');
};

module.exports = { init, stop };
