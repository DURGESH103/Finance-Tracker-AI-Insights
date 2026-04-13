const Budget = require('../models/Budget');

exports.create = async (req, res) => {
  const { category, limit, period } = req.body;
  const now = new Date();
  const budget = await Budget.findOneAndUpdate(
    { userId: req.user._id, category, month: now.getMonth() + 1, year: now.getFullYear() },
    { limit, period, spent: 0, alertSent: false },
    { upsert: true, new: true }
  );
  res.status(201).json(budget);
};

exports.getAll = async (req, res) => {
  const now = new Date();
  const budgets = await Budget.find({
    userId: req.user._id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  res.json(budgets);
};

exports.update = async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  if (!budget) return res.status(404).json({ message: 'Budget not found' });
  res.json(budget);
};

exports.remove = async (req, res) => {
  await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: 'Deleted' });
};
