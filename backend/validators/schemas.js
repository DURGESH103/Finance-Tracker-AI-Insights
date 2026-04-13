const Joi = require('joi');

const CATEGORIES = [
  'food', 'transport', 'shopping', 'entertainment', 'health',
  'rent', 'utilities', 'travel', 'education', 'salary',
  'freelance', 'investment', 'other',
];

// ─── Auth ────────────────────────────────────────────────────────────────────
exports.register = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
});

exports.login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Transaction ─────────────────────────────────────────────────────────────
exports.createTransaction = Joi.object({
  amount: Joi.number().positive().max(10_000_000).required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().valid(...CATEGORIES).default('other'),
  description: Joi.string().trim().max(200).allow('', null),
  date: Joi.date().iso().max('now').default(() => new Date()),
  accountId: Joi.string().hex().length(24).allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
});

exports.updateTransaction = Joi.object({
  amount: Joi.number().positive().max(10_000_000),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().valid(...CATEGORIES),
  description: Joi.string().trim().max(200).allow('', null),
  date: Joi.date().iso(),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
}).min(1);

// ─── Budget ──────────────────────────────────────────────────────────────────
exports.createBudget = Joi.object({
  category: Joi.string().valid(...CATEGORIES).required(),
  limit: Joi.number().positive().max(10_000_000).required(),
  period: Joi.string().valid('weekly', 'monthly').default('monthly'),
});

// ─── Goal ────────────────────────────────────────────────────────────────────
exports.createGoal = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  targetAmount: Joi.number().positive().max(100_000_000).required(),
  deadline: Joi.date().iso().min('now').allow(null),
  icon: Joi.string().max(10).default('🎯'),
  category: Joi.string().max(50).default('savings'),
});

exports.contributeGoal = Joi.object({
  amount: Joi.number().positive().max(10_000_000).required(),
});

// ─── Investment ───────────────────────────────────────────────────────────────
exports.createInvestment = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  type: Joi.string().valid('stock', 'crypto', 'mutual_fund', 'fd', 'gold', 'other').required(),
  symbol: Joi.string().uppercase().max(20).allow('', null),
  units: Joi.number().positive().required(),
  buyPrice: Joi.number().positive().required(),
  currentPrice: Joi.number().positive().allow(null),
  buyDate: Joi.date().iso().default(() => new Date()),
  notes: Joi.string().max(500).allow('', null),
});

exports.updateInvestment = Joi.object({
  currentPrice: Joi.number().positive(),
  units: Joi.number().positive(),
  notes: Joi.string().max(500).allow('', null),
}).min(1);

// ─── AI Chat ─────────────────────────────────────────────────────────────────
exports.chat = Joi.object({
  message: Joi.string().trim().min(1).max(1000).required(),
  history: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().max(2000).required(),
    })
  ).max(20).default([]),
});

// ─── Simulator ───────────────────────────────────────────────────────────────
exports.simulate = Joi.object({
  monthlyIncome: Joi.number().positive().required(),
  monthlyExpenses: Joi.number().positive().required(),
  reductionPercent: Joi.number().min(0).max(100).default(0),
  months: Joi.number().integer().min(1).max(120).default(12),
  annualReturnRate: Joi.number().min(0).max(50).default(8),
});
