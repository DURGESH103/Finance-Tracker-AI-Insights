import { Category } from '@/types';

export const CATEGORY_META: Record<Category, { icon: string; color: string; bg: string }> = {
  food:          { icon: '🍔', color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  transport:     { icon: '🚗', color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  shopping:      { icon: '🛍️', color: 'text-pink-400',    bg: 'bg-pink-400/10' },
  entertainment: { icon: '🎬', color: 'text-purple-400',  bg: 'bg-purple-400/10' },
  health:        { icon: '💊', color: 'text-green-400',   bg: 'bg-green-400/10' },
  rent:          { icon: '🏠', color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  utilities:     { icon: '⚡', color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
  travel:        { icon: '✈️', color: 'text-indigo-400',  bg: 'bg-indigo-400/10' },
  education:     { icon: '📚', color: 'text-teal-400',    bg: 'bg-teal-400/10' },
  salary:        { icon: '💼', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  freelance:     { icon: '💻', color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  investment:    { icon: '📈', color: 'text-lime-400',    bg: 'bg-lime-400/10' },
  other:         { icon: '📦', color: 'text-gray-400',    bg: 'bg-gray-400/10' },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export const formatCurrency = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const CHART_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];
