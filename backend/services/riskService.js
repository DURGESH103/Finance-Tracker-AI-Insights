const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');

exports.detectRisks = async (userId) => {
  const now = new Date();
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);
  const threeMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Fetch current-month transactions once — both income and expense
  const [currentTxs, lastMonthAgg, budgets, subscriptions, monthlyHistory] = await Promise.all([
    Transaction.find({ userId, date: { $gte: startOfMonth } }).select('type category amount').lean(),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth }, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
    Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() }).lean(),
    Subscription.find({ userId, active: true }).lean(),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: threeMonthsAgo }, type: 'expense' } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  // Derive income presence from already-fetched data — no extra DB call
  const hasIncome = currentTxs.some((t) => t.type === 'income');
  const currentExpenses = currentTxs.filter((t) => t.type === 'expense');

  const risks = [];

  // ── 1. Budget overruns ───────────────────────────────────────────────────
  budgets.forEach((b) => {
    const pct = (b.spent / b.limit) * 100;
    if (pct >= 100) {
      risks.push({
        type: 'budget_exceeded', severity: 'critical', category: b.category,
        title: `${b.category} budget exceeded`,
        message: `Spent ₹${b.spent.toLocaleString()} vs ₹${b.limit.toLocaleString()} limit (${pct.toFixed(0)}%)`,
        amount: b.spent - b.limit,
      });
    } else if (pct >= 80) {
      risks.push({
        type: 'budget_warning', severity: 'high', category: b.category,
        title: `${b.category} budget at ${pct.toFixed(0)}%`,
        message: `Only ₹${(b.limit - b.spent).toLocaleString()} remaining this month`,
        amount: b.limit - b.spent,
      });
    }
  });

  // ── 2. Unusual spending spikes (>50% increase vs last month) ────────────
  const currentByCategory = currentExpenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
  const lastByCategory = lastMonthAgg.reduce((acc, i) => { acc[i._id] = i.total; return acc; }, {});

  Object.entries(currentByCategory).forEach(([cat, amount]) => {
    const last = lastByCategory[cat];
    if (last && amount > last * 1.5 && amount - last > 500) {
      const pctIncrease = (((amount - last) / last) * 100).toFixed(0);
      risks.push({
        type: 'spending_spike', severity: 'medium', category: cat,
        title: `${cat} spending up ${pctIncrease}%`,
        message: `₹${amount.toLocaleString()} this month vs ₹${last.toLocaleString()} last month`,
        amount: amount - last,
      });
    }
  });

  // ── 3. High subscription burden (>20% of avg monthly expense) ───────────
  if (subscriptions.length > 0 && monthlyHistory.length > 0) {
    const avgExpense = monthlyHistory.reduce((a, b) => a + b.total, 0) / monthlyHistory.length;
    const monthlySubTotal = subscriptions.reduce((acc, s) => {
      if (s.frequency === 'monthly') return acc + s.amount;
      if (s.frequency === 'weekly')  return acc + s.amount * 4.33;
      if (s.frequency === 'yearly')  return acc + s.amount / 12;
      return acc;
    }, 0);
    const subPct = avgExpense > 0 ? (monthlySubTotal / avgExpense) * 100 : 0;
    if (subPct > 20) {
      risks.push({
        type: 'high_subscriptions', severity: 'medium',
        title: 'High subscription burden',
        message: `Subscriptions cost ₹${Math.round(monthlySubTotal).toLocaleString()}/mo (${subPct.toFixed(0)}% of expenses)`,
        amount: Math.round(monthlySubTotal),
      });
    }
  }

  // ── 4. Expense volatility ────────────────────────────────────────────────
  if (monthlyHistory.length >= 3) {
    const totals = monthlyHistory.map((m) => m.total);
    const avg    = totals.reduce((a, b) => a + b, 0) / totals.length;
    const stdDev = Math.sqrt(totals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / totals.length);
    const cv     = avg > 0 ? stdDev / avg : 0;
    if (cv > 0.4) {
      risks.push({
        type: 'high_volatility', severity: 'low',
        title: 'Inconsistent spending pattern',
        message: `Your monthly expenses vary by ±${(cv * 100).toFixed(0)}%. Aim for more consistency.`,
        amount: Math.round(stdDev),
      });
    }
  }

  // ── 5. No income recorded this month ────────────────────────────────────
  if (!hasIncome) {
    risks.push({
      type: 'no_income', severity: 'high',
      title: 'No income recorded this month',
      message: 'Add your income transactions to get accurate financial insights',
      amount: 0,
    });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
};
