const Budget = require('../models/Budget');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.create = asyncHandler(async (req, res) => {
  const { category, limit, period } = req.body;
  const now = new Date();
  const budget = await Budget.findOneAndUpdate(
    { userId: req.user._id, category, month: now.getMonth() + 1, year: now.getFullYear() },
    { limit, period, spent: 0, alertSent: false },
    { upsert: true, new: true }
  );
  logger.audit(req.user._id, 'BUDGET_SET', { category, limit });
  res.status(201).json({ success: true, data: budget });
});

exports.getAll = asyncHandler(async (req, res) => {
  const now = new Date();
  const budgets = await Budget.find({
    userId: req.user._id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }).lean();
  res.json({ success: true, data: budgets });
});

exports.update = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true }
  );
  if (!budget) throw new AppError('Budget not found', 404);
  res.json({ success: true, data: budget });
});

exports.remove = asyncHandler(async (req, res) => {
  await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, message: 'Deleted' });
});
