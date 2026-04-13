const Subscription = require('../models/Subscription');
const { detectSubscriptions } = require('../services/aiService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.getAll = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ userId: req.user._id, active: true }).sort({ nextDue: 1 }).lean();
  res.json({ success: true, data: subs });
});

exports.detect = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const detected = await detectSubscriptions(req.user._id);
  if (!detected.length) return res.json({ success: true, data: [] });

  const ops = detected.map((s) => ({
    updateOne: {
      filter: { userId: req.user._id, name: s.name, amount: s.amount },
      update: { $setOnInsert: { ...s, userId: req.user._id } },
      upsert: true,
    },
  }));
  await Subscription.bulkWrite(ops);

  const subs = await Subscription.find({ userId: req.user._id, active: true }).lean();

  if (detected.length > 0) {
    io?.to(req.user._id.toString()).emit('subscription:detected', {
      count: detected.length,
      message: `${detected.length} recurring payment(s) detected`,
    });
  }

  logger.audit(req.user._id, 'SUBSCRIPTIONS_DETECTED', { count: detected.length });
  res.json({ success: true, data: subs });
});

exports.create = asyncHandler(async (req, res) => {
  const sub = await Subscription.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, data: sub });
});

exports.update = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true }
  );
  if (!sub) throw new AppError('Subscription not found', 404);
  res.json({ success: true, data: sub });
});

exports.remove = asyncHandler(async (req, res) => {
  await Subscription.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { active: false }
  );
  res.json({ success: true, message: 'Cancelled' });
});
