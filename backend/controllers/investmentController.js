const Investment = require('../models/Investment');
const { analyzePortfolio } = require('../services/investmentService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.getAll = asyncHandler(async (req, res) => {
  // Do NOT use .lean() — virtuals (currentValue, pnl, etc.) are needed for portfolio math
  const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });

  const portfolio = investments.reduce((acc, inv) => {
    acc.totalInvested += inv.investedValue;
    acc.currentValue  += inv.currentValue;
    acc.pnl           += inv.pnl;
    return acc;
  }, { totalInvested: 0, currentValue: 0, pnl: 0 });

  portfolio.pnlPct = portfolio.totalInvested
    ? +((portfolio.pnl / portfolio.totalInvested) * 100).toFixed(2)
    : 0;

  res.json({
    success: true,
    data: {
      investments: investments.map((i) => i.toJSON()),
      portfolio,
    },
  });
});

exports.create = asyncHandler(async (req, res) => {
  const inv = await Investment.create({ ...req.body, userId: req.user._id });
  logger.audit(req.user._id, 'INVESTMENT_ADDED', { name: inv.name, type: inv.type });
  res.status(201).json({ success: true, data: inv });
});

exports.update = asyncHandler(async (req, res) => {
  const inv = await Investment.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true }
  );
  if (!inv) throw new AppError('Investment not found', 404);
  res.json({ success: true, data: inv });
});

exports.remove = asyncHandler(async (req, res) => {
  const inv = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!inv) throw new AppError('Investment not found', 404);
  logger.audit(req.user._id, 'INVESTMENT_REMOVED', { name: inv.name });
  res.json({ success: true, message: 'Deleted' });
});

exports.getIntelligence = asyncHandler(async (req, res) => {
  const analysis = await analyzePortfolio(req.user._id);
  res.json({ success: true, data: analysis });
});
