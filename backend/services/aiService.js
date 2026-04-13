const OpenAI = require('openai');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = [
  'food', 'transport', 'shopping', 'entertainment', 'health',
  'rent', 'utilities', 'travel', 'education', 'salary',
  'freelance', 'investment', 'other',
];

// ─── Auto-categorize ────────────────────────────────────────────────────────
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

// ─── Generate monthly AI insights ───────────────────────────────────────────
exports.generateInsights = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentTxs, lastMonthAgg, budgets, goals] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth }, type: 'expense' }),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth }, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
    Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() }),
    Goal.find({ userId, completed: false }),
  ]);

  const currentByCategory = currentTxs.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
  const lastByCategory = lastMonthAgg.reduce((acc, i) => { acc[i._id] = i.total; return acc; }, {});
  const totalCurrent = Object.values(currentByCategory).reduce((a, b) => a + b, 0);

  const budgetStatus = budgets.map(b => ({
    category: b.category,
    limit: b.limit,
    spent: b.spent,
    overBy: Math.max(0, b.spent - b.limit),
  }));

  const goalStatus = goals.map(g => ({
    title: g.title,
    target: g.targetAmount,
    saved: g.savedAmount,
    pct: Math.round((g.savedAmount / g.targetAmount) * 100),
  }));

  const prompt = `You are a personal finance AI advisor. Analyze this data and return a JSON array of 4-5 actionable insights.

Current month expenses by category (INR): ${JSON.stringify(currentByCategory)}
Last month expenses by category (INR): ${JSON.stringify(lastByCategory)}
Total spent this month: ₹${totalCurrent}
Budget status: ${JSON.stringify(budgetStatus)}
Active goals: ${JSON.stringify(goalStatus)}

Rules:
- Be specific with rupee amounts and percentages
- Compare current vs last month where relevant
- Flag budget overruns as warnings
- Suggest concrete saving actions
- Keep each text under 120 chars
- Return ONLY valid JSON array, no markdown

Schema: [{ type: "warning"|"tip"|"prediction"|"summary", title: string, text: string, category?: string, savingsAmount?: number }]`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });
    const content = res.choices[0].message.content.trim();
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
};

// ─── Predict next month spending ────────────────────────────────────────────
exports.predictNextMonth = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const history = await Transaction.aggregate([
    { $match: { userId, date: { $gte: sixMonthsAgo }, type: 'expense' } },
    { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  if (history.length < 2) return null;

  const totals = history.map(h => h.total);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  // Weighted: recent months count more
  const weighted = totals.reduce((acc, v, i) => acc + v * (i + 1), 0) /
    totals.reduce((acc, _, i) => acc + (i + 1), 0);
  return Math.round((avg + weighted) / 2);
};

// ─── Financial Health Score (0-100) ─────────────────────────────────────────
exports.calculateHealthScore = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [monthlyStats, budgets, goals, recentMonths] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() }),
    Goal.find({ userId }),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: threeMonthsAgo }, type: 'expense' } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const income = monthlyStats.find(s => s._id === 'income')?.total || 0;
  const expense = monthlyStats.find(s => s._id === 'expense')?.total || 0;

  // 1. Savings rate (0-30 pts): 20%+ savings = full score
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const savingsScore = Math.min(30, (savingsRate / 20) * 30);

  // 2. Budget adherence (0-25 pts)
  let budgetScore = 25;
  if (budgets.length > 0) {
    const overBudget = budgets.filter(b => b.spent > b.limit).length;
    budgetScore = Math.max(0, 25 - (overBudget / budgets.length) * 25);
  }

  // 3. Expense consistency (0-20 pts): low variance = good
  let consistencyScore = 20;
  if (recentMonths.length >= 2) {
    const totals = recentMonths.map(m => m.total);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance = totals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / totals.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0; // coefficient of variation
    consistencyScore = Math.max(0, 20 - cv * 20);
  }

  // 4. Goal progress (0-15 pts)
  let goalScore = 0;
  if (goals.length > 0) {
    const avgProgress = goals.reduce((a, g) => a + Math.min(1, g.savedAmount / g.targetAmount), 0) / goals.length;
    goalScore = avgProgress * 15;
  } else {
    goalScore = 7; // neutral if no goals set
  }

  // 5. Income stability (0-10 pts): has income this month
  const incomeScore = income > 0 ? 10 : 0;

  const total = Math.round(savingsScore + budgetScore + consistencyScore + goalScore + incomeScore);
  const score = Math.min(100, Math.max(0, total));

  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';

  return {
    score,
    grade,
    breakdown: {
      savingsRate: Math.round(savingsScore),
      budgetAdherence: Math.round(budgetScore),
      expenseConsistency: Math.round(consistencyScore),
      goalProgress: Math.round(goalScore),
      incomeStability: Math.round(incomeScore),
    },
  };
};

// ─── Detect recurring subscriptions ─────────────────────────────────────────
exports.detectSubscriptions = async (userId) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const txs = await Transaction.find({
    userId,
    type: 'expense',
    date: { $gte: threeMonthsAgo },
  }).sort({ date: 1 });

  // Group by description similarity and amount
  const groups = {};
  txs.forEach(tx => {
    if (!tx.description) return;
    const key = `${tx.description.toLowerCase().trim()}_${tx.amount}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  const recurring = [];
  Object.entries(groups).forEach(([, txList]) => {
    if (txList.length < 2) return;
    const dates = txList.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    let frequency = null;
    if (avgGap >= 25 && avgGap <= 35) frequency = 'monthly';
    else if (avgGap >= 5 && avgGap <= 9) frequency = 'weekly';
    else if (avgGap >= 340 && avgGap <= 390) frequency = 'yearly';

    if (frequency) {
      const last = txList[txList.length - 1];
      const nextDue = new Date(last.date);
      if (frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
      else if (frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else nextDue.setFullYear(nextDue.getFullYear() + 1);

      recurring.push({
        name: last.description,
        amount: last.amount,
        frequency,
        category: last.category,
        nextDue,
        detectedFromTx: last._id,
        icon: '🔄',
      });
    }
  });

  return recurring;
};

// ─── Spending pattern analysis ───────────────────────────────────────────────
exports.analyzeSpendingPatterns = async (userId) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const txs = await Transaction.find({ userId, type: 'expense', date: { $gte: threeMonthsAgo } });

  // Day-of-week pattern
  const byDow = Array(7).fill(0);
  const byHour = Array(24).fill(0);
  txs.forEach(tx => {
    const d = new Date(tx.date);
    byDow[d.getDay()] += tx.amount;
    byHour[d.getHours()] += tx.amount;
  });

  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakDay = dowLabels[byDow.indexOf(Math.max(...byDow))];
  const peakHour = byHour.indexOf(Math.max(...byHour));

  // Weekend vs weekday
  const weekendSpend = byDow[0] + byDow[6];
  const weekdaySpend = byDow.slice(1, 6).reduce((a, b) => a + b, 0);

  return {
    peakSpendingDay: peakDay,
    peakSpendingHour: peakHour,
    weekendVsWeekday: {
      weekend: Math.round(weekendSpend),
      weekday: Math.round(weekdaySpend),
    },
    dowBreakdown: dowLabels.map((label, i) => ({ day: label, amount: Math.round(byDow[i]) })),
  };
};

// ─── Chat assistant ──────────────────────────────────────────────────────────
exports.chatWithAssistant = async (userId, message, conversationHistory = []) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [recentTxs, monthlyStats, goals, budgets] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth } }).sort({ date: -1 }).limit(50),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Goal.find({ userId, completed: false }),
    Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() }),
  ]);

  const stats = monthlyStats.reduce((acc, s) => { acc[s._id] = s.total; return acc; }, {});
  const topCategories = recentTxs
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});

  const budgetAlerts = budgets
    .filter(b => b.spent > b.limit * 0.8)
    .map(b => `${b.category}: ₹${b.spent}/${b.limit}`);

  const systemPrompt = `You are a smart personal finance assistant for an Indian user. Be concise, specific, and helpful.

Financial context (this month):
- Income: ₹${stats.income || 0} | Expenses: ₹${stats.expense || 0} | Savings: ₹${(stats.income || 0) - (stats.expense || 0)}
- Savings rate: ${stats.income ? (((stats.income - stats.expense) / stats.income) * 100).toFixed(1) : 0}%
- Top spending: ${JSON.stringify(topCategories)}
- Budget alerts (>80% used): ${budgetAlerts.join(', ') || 'none'}
- Active goals: ${goals.map(g => `${g.title} (${Math.round((g.savedAmount / g.targetAmount) * 100)}%)`).join(', ') || 'none'}
- Recent: ${recentTxs.slice(0, 8).map(t => `${t.type} ₹${t.amount} (${t.category})`).join(', ')}

Keep responses under 150 words. Use ₹ for amounts. Be actionable.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8),
    { role: 'user', content: message },
  ];

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 350,
    temperature: 0.7,
  });

  return res.choices[0].message.content;
};
