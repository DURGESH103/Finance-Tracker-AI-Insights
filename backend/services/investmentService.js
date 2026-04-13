const Investment = require('../models/Investment');

const RISK_PROFILE = {
  stock:       { risk: 'high',   weight: 3, idealPct: 40 },
  crypto:      { risk: 'very_high', weight: 4, idealPct: 10 },
  mutual_fund: { risk: 'medium', weight: 2, idealPct: 30 },
  fd:          { risk: 'low',    weight: 1, idealPct: 15 },
  gold:        { risk: 'low',    weight: 1, idealPct: 10 },
  other:       { risk: 'medium', weight: 2, idealPct: 5  },
};

exports.analyzePortfolio = async (userId) => {
  const investments = await Investment.find({ userId });
  if (!investments.length) return null;

  const totalValue = investments.reduce((a, i) => a + i.currentValue, 0);
  const totalInvested = investments.reduce((a, i) => a + i.investedValue, 0);

  // ── Allocation by type ───────────────────────────────────────────────────
  const allocationMap = {};
  investments.forEach((inv) => {
    if (!allocationMap[inv.type]) allocationMap[inv.type] = { value: 0, invested: 0, count: 0 };
    allocationMap[inv.type].value += inv.currentValue;
    allocationMap[inv.type].invested += inv.investedValue;
    allocationMap[inv.type].count += 1;
  });

  const allocation = Object.entries(allocationMap).map(([type, data]) => ({
    type,
    value: Math.round(data.value),
    invested: Math.round(data.invested),
    pct: totalValue > 0 ? +((data.value / totalValue) * 100).toFixed(1) : 0,
    pnl: Math.round(data.value - data.invested),
    risk: RISK_PROFILE[type]?.risk || 'medium',
  }));

  // ── Diversification score (0-100) ────────────────────────────────────────
  const typeCount = Object.keys(allocationMap).length;
  const maxTypes = Object.keys(RISK_PROFILE).length;
  const typeScore = (typeCount / maxTypes) * 40; // 40 pts for variety

  // Concentration penalty: if any single type > 60%, penalise
  const maxConcentration = Math.max(...allocation.map((a) => a.pct));
  const concentrationScore = Math.max(0, 40 - Math.max(0, maxConcentration - 40) * 0.8);

  // Ideal allocation deviation
  let deviationPenalty = 0;
  allocation.forEach((a) => {
    const ideal = RISK_PROFILE[a.type]?.idealPct || 10;
    deviationPenalty += Math.abs(a.pct - ideal) * 0.1;
  });
  const allocationScore = Math.max(0, 20 - deviationPenalty);

  const diversificationScore = Math.round(Math.min(100, typeScore + concentrationScore + allocationScore));

  // ── Overall risk level ───────────────────────────────────────────────────
  const weightedRisk = allocation.reduce((acc, a) => {
    return acc + (RISK_PROFILE[a.type]?.weight || 2) * (a.pct / 100);
  }, 0);
  const riskLevel = weightedRisk >= 3 ? 'high' : weightedRisk >= 2 ? 'medium' : 'low';

  // ── Rebalancing suggestions ──────────────────────────────────────────────
  const suggestions = [];
  allocation.forEach((a) => {
    const ideal = RISK_PROFILE[a.type]?.idealPct || 10;
    const diff = a.pct - ideal;
    if (diff > 15) {
      suggestions.push({
        type: 'reduce',
        assetType: a.type,
        message: `${a.type.replace('_', ' ')} is ${diff.toFixed(0)}% over ideal allocation. Consider rebalancing.`,
        severity: diff > 30 ? 'high' : 'medium',
      });
    } else if (diff < -10 && totalValue > 10000) {
      suggestions.push({
        type: 'increase',
        assetType: a.type,
        message: `Consider increasing ${a.type.replace('_', ' ')} allocation by ~${Math.abs(diff).toFixed(0)}%.`,
        severity: 'low',
      });
    }
  });

  // ── P&L trend (top performers / losers) ─────────────────────────────────
  const sorted = [...investments].sort((a, b) => b.pnl - a.pnl);
  const topPerformers = sorted.slice(0, 3).map((i) => ({
    name: i.name, type: i.type, pnl: Math.round(i.pnl), pnlPct: i.pnlPct,
  }));
  const underperformers = sorted.slice(-3).reverse()
    .filter((i) => i.pnl < 0)
    .map((i) => ({ name: i.name, type: i.type, pnl: Math.round(i.pnl), pnlPct: i.pnlPct }));

  return {
    summary: {
      totalInvested: Math.round(totalInvested),
      currentValue: Math.round(totalValue),
      totalPnl: Math.round(totalValue - totalInvested),
      pnlPct: totalInvested > 0 ? +((((totalValue - totalInvested) / totalInvested) * 100).toFixed(2)) : 0,
      diversificationScore,
      riskLevel,
      holdingsCount: investments.length,
    },
    allocation,
    suggestions,
    topPerformers,
    underperformers,
  };
};
