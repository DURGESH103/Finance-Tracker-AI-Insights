const Insight = require('../models/Insight');
const { generateInsights, predictNextMonth, chatWithAssistant } = require('../services/aiService');

exports.getInsights = async (req, res) => {
  const insights = await Insight.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
  res.json(insights);
};

exports.refreshInsights = async (req, res) => {
  const raw = await generateInsights(req.user._id);
  if (!raw.length) return res.json([]);

  await Insight.deleteMany({
    userId: req.user._id,
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });

  const insights = await Insight.insertMany(
    raw.map(i => ({ ...i, userId: req.user._id }))
  );
  res.json(insights);
};

exports.getPrediction = async (req, res) => {
  const prediction = await predictNextMonth(req.user._id);
  res.json({ predictedAmount: prediction });
};

exports.chat = async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ message: 'Message required' });

  const reply = await chatWithAssistant(req.user._id, message, history || []);
  res.json({ reply });
};

exports.markRead = async (req, res) => {
  await Insight.updateMany({ userId: req.user._id }, { read: true });
  res.json({ message: 'Marked as read' });
};
