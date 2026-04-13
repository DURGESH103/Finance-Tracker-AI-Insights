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
}

export type Category =
  | 'food' | 'transport' | 'shopping' | 'entertainment' | 'health'
  | 'rent' | 'utilities' | 'travel' | 'education' | 'salary'
  | 'freelance' | 'investment' | 'other';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
