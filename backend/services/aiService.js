const OpenAI = require('openai');
const Transaction = require('../models/Transaction');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = ['food', 'transport', 'shopping', 'entertainment', 'health', 'rent', 'utilities', 'travel', 'education', 'salary', 'freelance', 'investment', 'other'];

// Auto-categorize a transaction description
exports.categorizeWithAI = async (description) => {
  if (!description) return 'other';
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Categorize this transaction into exactly one of: ${CATEGORIES.join(', ')}.\nTransaction: "${description}"\nRespond with only the category word.`,
      }],
      max_tokens: 10,
      temperature: 0,
    });
    const cat = res.choices[0].message.content.trim().toLowerCase();
    return CATEGORIES.includes(cat) ? cat : 'other';
  } catch {
    return 'other';
  }
};

// Generate monthly AI insights
exports.generateInsights = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentTxs, lastMonthByCategory] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth }, type: 'expense' }),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth }, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);

  const currentByCategory = currentTxs.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});

  const lastByCategory = lastMonthByCategory.reduce((acc, item) => {
    acc[item._id] = item.total;
    return acc;
  }, {});

  const totalCurrent = Object.values(currentByCategory).reduce((a, b) => a + b, 0);

  const prompt = `You are a personal finance AI. Analyze this spending data and return a JSON array of 3-4 insights.

Current month spending by category (INR): ${JSON.stringify(currentByCategory)}
Last month spending by category (INR): ${JSON.stringify(lastByCategory)}
Total this month: ₹${totalCurrent}

Return JSON array with objects: { type: "warning"|"tip"|"prediction"|"summary", title: string, text: string, category?: string, savingsAmount?: number }
Be specific with numbers. Keep text under 100 chars. No markdown.`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = res.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
};

// Predict next month spending
exports.predictNextMonth = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const history = await Transaction.aggregate([
    { $match: { userId, date: { $gte: sixMonthsAgo }, type: 'expense' } },
    {
      $group: {
        _id: { month: { $month: '$date' }, year: { $year: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  if (history.length < 2) return null;

  const totals = history.map(h => h.total);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const trend = totals.length > 1 ? (totals[totals.length - 1] - totals[0]) / totals.length : 0;

  return Math.round(avg + trend);
};

// Chat assistant
exports.chatWithAssistant = async (userId, message, conversationHistory = []) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [recentTxs, monthlyStats] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth } }).sort({ date: -1 }).limit(50),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const stats = monthlyStats.reduce((acc, s) => { acc[s._id] = s.total; return acc; }, {});
  const topCategories = recentTxs
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

  const systemPrompt = `You are a smart personal finance assistant. Be concise, helpful, and specific.

User's financial context (this month):
- Total Income: ₹${stats.income || 0}
- Total Expenses: ₹${stats.expense || 0}  
- Savings: ₹${(stats.income || 0) - (stats.expense || 0)}
- Top spending categories: ${JSON.stringify(topCategories)}
- Recent transactions: ${recentTxs.slice(0, 10).map(t => `${t.type} ₹${t.amount} on ${t.category}`).join(', ')}

Answer finance questions based on this data. Keep responses under 150 words.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: message },
  ];

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });

  return res.choices[0].message.content;
};
