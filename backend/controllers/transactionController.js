const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { categorizeWithAI } = require('../services/aiService');

exports.create = async (req, res) => {
  const { amount, type, category, description, date, accountId } = req.body;

  let finalCategory = category;
  if (!category || category === 'other') {
    finalCategory = await categorizeWithAI(description) || 'other';
  }

  const tx = await Transaction.create({
    userId: req.user._id,
    accountId,
    amount,
    type,
    category: finalCategory,
    description,
    date: date || new Date(),
    aiCategorized: !category || category === 'other',
  });

  // Update budget spent
  if (type === 'expense') {
    const now = new Date(tx.date);
    await Budget.findOneAndUpdate(
      { userId: req.user._id, category: finalCategory, month: now.getMonth() + 1, year: now.getFullYear() },
      { $inc: { spent: amount } }
    );
  }

  res.status(201).json(tx);
};

exports.getAll = async (req, res) => {
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
    Transaction.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(+limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ transactions, total, pages: Math.ceil(total / limit) });
};

exports.getOne = async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
};

exports.update = async (req, res) => {
  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
};

exports.remove = async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ message: 'Deleted' });
};

exports.getAnalytics = async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [categoryBreakdown, monthlyTrend, currentMonthSummary, lastMonthSummary] = await Promise.all([
    // Category-wise breakdown (current month)
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: startOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),

    // Last 6 months trend
    Transaction.aggregate([
      { $match: { userId, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Current month totals
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),

    // Last month totals
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
  ]);

  res.json({ categoryBreakdown, monthlyTrend, currentMonthSummary, lastMonthSummary });
};
