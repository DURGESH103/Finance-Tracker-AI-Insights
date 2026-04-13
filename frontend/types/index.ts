export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  accounts: Account[];
  monthlyBudget: number;
  currency: string;
  theme: 'dark' | 'light';
}

export interface Account {
  _id: string;
  name: string;
  type: 'cash' | 'bank' | 'wallet' | 'credit';
  balance: number;
  currency: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  accountId?: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  description: string;
  date: string;
  aiCategorized: boolean;
  tags: string[];
  createdAt: string;
}

export interface Budget {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
  month: number;
  year: number;
}

export interface Insight {
  _id: string;
  type: 'warning' | 'tip' | 'prediction' | 'summary';
  title: string;
  text: string;
  category?: string;
  savingsAmount?: number;
  read: boolean;
  createdAt: string;
}

export interface Analytics {
  categoryBreakdown: { _id: string; total: number; count: number }[];
  monthlyTrend: { _id: { month: number; year: number; type: string }; total: number }[];
  currentMonthSummary: { _id: string; total: number }[];
  lastMonthSummary: { _id: string; total: number }[];
  cashFlow: { _id: { day: number; type: string }; total: number }[];
}

export interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  category: string;
  icon: string;
  completed: boolean;
  streak: number;
  lastContribution?: string;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  category: string;
  nextDue?: string;
  active: boolean;
  icon: string;
}

export interface Investment {
  _id: string;
  name: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'fd' | 'gold' | 'other';
  symbol?: string;
  units: number;
  buyPrice: number;
  currentPrice?: number;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPct: string;
  buyDate: string;
}

export interface FinancialScore {
  score: number;
  grade: string;
  breakdown: {
    savingsRate: number;
    budgetAdherence: number;
    expenseConsistency: number;
    goalProgress: number;
    incomeStability: number;
  };
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

export interface Gamification {
  points: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  earnedBadges: { badgeId: string; earnedAt: string }[];
  allBadges: Badge[];
  insightRefreshCount: number;
}

export interface SpendingPattern {
  peakSpendingDay: string;
  peakSpendingHour: number;
  weekendVsWeekday: { weekend: number; weekday: number };
  dowBreakdown: { day: string; amount: number }[];
}

export interface NetWorthPoint {
  month: string;
  netWorth: number;
  income: number;
  expense: number;
}

export type Category =
  | 'food' | 'transport' | 'shopping' | 'entertainment' | 'health'
  | 'rent' | 'utilities' | 'travel' | 'education' | 'salary'
  | 'freelance' | 'investment' | 'other';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
