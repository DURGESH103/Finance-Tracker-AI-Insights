const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');

/**
 * Core compound growth formula
 * FV = PV * (1 + r)^n + PMT * [((1+r)^n - 1) / r]
 */
const compoundGrowth = (presentValue, monthlyContribution, annualRate, months) => {
  const r = annualRate / 100 / 12;
  if (r === 0) return presentValue + monthlyContribution * months;
  const growth = Math.pow(1 + r, months);
  return presentValue * growth + monthlyContribution * ((growth - 1) / r);
};

/**
 * Run a multi-scenario savings simulation
 */
exports.runSimulation = async (userId, params) => {
  const {
    monthlyIncome,
    monthlyExpenses,
    reductionPercent = 0,
    months = 12,
    annualReturnRate = 8,
  } = params;

  // Pull real spending data for context
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const [realHistory, goals] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo }, type: 'expense' } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Goal.find({ userId, completed: false }),
  ]);

  const avgRealExpense = realHistory.length
    ? realHistory.reduce((a, b) => a + b.total, 0) / realHistory.length
    : monthlyExpenses;

  // ── Scenario A: Current trajectory (no change) ──────────────────────────
  const currentSavings = monthlyIncome - monthlyExpenses;
  const scenarioA = buildTimeline(0, currentSavings, annualReturnRate, months);

  // ── Scenario B: Reduce expenses by reductionPercent ─────────────────────
  const reducedExpenses = monthlyExpenses * (1 - reductionPercent / 100);
  const improvedSavings = monthlyIncome - reducedExpenses;
  const scenarioB = buildTimeline(0, improvedSavings, annualReturnRate, months);

  // ── Scenario C: Invest savings at annualReturnRate ───────────────────────
  const scenarioC = buildTimeline(0, improvedSavings, annualReturnRate + 4, months);

  // ── Goal projections ─────────────────────────────────────────────────────
  const goalProjections = goals.map((g) => {
    const remaining = g.targetAmount - g.savedAmount;
    const monthsNeeded = improvedSavings > 0
      ? Math.ceil(remaining / improvedSavings)
      : null;
    const achieveDate = monthsNeeded
      ? new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1)
      : null;
    return {
      title: g.title,
      icon: g.icon,
      targetAmount: g.targetAmount,
      savedAmount: g.savedAmount,
      remaining,
      monthsNeeded,
      achieveDate,
      onTrack: g.deadline ? (achieveDate && achieveDate <= new Date(g.deadline)) : null,
    };
  });

  // ── Breakeven analysis ───────────────────────────────────────────────────
  const monthsToBreakeven = currentSavings > 0
    ? Math.ceil(avgRealExpense / currentSavings)
    : null;

  return {
    inputs: { monthlyIncome, monthlyExpenses, reductionPercent, months, annualReturnRate },
    realAvgExpense: Math.round(avgRealExpense),
    currentMonthlySavings: Math.round(currentSavings),
    improvedMonthlySavings: Math.round(improvedSavings),
    scenarios: {
      current: { label: 'Current Trajectory', data: scenarioA, finalValue: scenarioA[scenarioA.length - 1]?.cumulative || 0 },
      reduced: { label: `${reductionPercent}% Expense Reduction`, data: scenarioB, finalValue: scenarioB[scenarioB.length - 1]?.cumulative || 0 },
      invested: { label: 'Reduced + Invested', data: scenarioC, finalValue: scenarioC[scenarioC.length - 1]?.cumulative || 0 },
    },
    goalProjections,
    monthsToBreakeven,
    totalSavingsGain: Math.round(
      (scenarioB[scenarioB.length - 1]?.cumulative || 0) -
      (scenarioA[scenarioA.length - 1]?.cumulative || 0)
    ),
  };
};

function buildTimeline(startValue, monthlySaving, annualRate, months) {
  const timeline = [];
  let cumulative = startValue;
  const r = annualRate / 100 / 12;

  for (let m = 1; m <= months; m++) {
    cumulative = r > 0
      ? cumulative * (1 + r) + monthlySaving
      : cumulative + monthlySaving;
    timeline.push({ month: m, cumulative: Math.round(cumulative), saving: Math.round(monthlySaving) });
  }
  return timeline;
}
