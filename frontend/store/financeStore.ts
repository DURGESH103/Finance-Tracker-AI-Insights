import { create } from 'zustand';
import api from '@/lib/api';
import { Budget, Insight, FinancialScore, Gamification, Subscription, SpendingPattern, NetWorthPoint } from '@/types';

interface Risk {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category?: string;
  amount: number;
}

interface FinanceState {
  budgets: Budget[];
  insights: Insight[];
  prediction: number | null;
  healthScore: FinancialScore | null;
  gamification: Gamification | null;
  subscriptions: Subscription[];
  patterns: SpendingPattern | null;
  netWorthHistory: NetWorthPoint[];
  currentNetWorth: number;
  risks: Risk[];

  fetchBudgets: () => Promise<void>;
  addBudget: (data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  fetchInsights: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  fetchPrediction: () => Promise<void>;
  fetchHealthScore: () => Promise<void>;
  fetchGamification: () => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  detectSubscriptions: () => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
  fetchPatterns: () => Promise<void>;
  fetchNetWorth: () => Promise<void>;
  fetchRisks: () => Promise<void>;
}

const unwrap = (res: any) => res.data?.data ?? res.data;

// Silently swallow non-auth errors so one failing endpoint
// doesn't block the rest of the dashboard from loading
const safe = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (err: any) {
    // Re-throw 401 so the api interceptor can handle token refresh / redirect
    if (err?.response?.status === 401) throw err;
    console.error('[store]', err?.response?.data?.message ?? err.message);
    return undefined;
  }
};

export const useFinanceStore = create<FinanceState>((set) => ({
  budgets: [],
  insights: [],
  prediction: null,
  healthScore: null,
  gamification: null,
  subscriptions: [],
  patterns: null,
  netWorthHistory: [],
  currentNetWorth: 0,
  risks: [],

  fetchBudgets: async () => {
    const res = await safe(() => api.get('/budgets'));
    if (res) set({ budgets: unwrap(res) ?? [] });
  },

  addBudget: async (payload) => {
    const res = await api.post('/budgets', payload);
    const data = unwrap(res);
    set((s) => ({ budgets: [...s.budgets.filter((b) => b._id !== data._id), data] }));
  },

  deleteBudget: async (id) => {
    await api.delete(`/budgets/${id}`);
    set((s) => ({ budgets: s.budgets.filter((b) => b._id !== id) }));
  },

  fetchInsights: async () => {
    const res = await safe(() => api.get('/ai'));
    if (res) set({ insights: unwrap(res) ?? [] });
  },

  refreshInsights: async () => {
    const res = await api.post('/ai/refresh');
    set({ insights: unwrap(res) ?? [] });
  },

  fetchPrediction: async () => {
    const res = await safe(() => api.get('/ai/predict'));
    if (res) {
      const d = unwrap(res);
      set({ prediction: d?.predictedAmount ?? d ?? null });
    }
  },

  fetchHealthScore: async () => {
    const res = await safe(() => api.get('/ai/health-score'));
    if (res) set({ healthScore: unwrap(res) });
  },

  fetchGamification: async () => {
    const res = await safe(() => api.get('/ai/gamification'));
    if (res) set({ gamification: unwrap(res) });
  },

  fetchSubscriptions: async () => {
    const res = await safe(() => api.get('/subscriptions'));
    if (res) set({ subscriptions: unwrap(res) ?? [] });
  },

  detectSubscriptions: async () => {
    const res = await safe(() => api.get('/subscriptions/detect'));
    if (res) set({ subscriptions: unwrap(res) ?? [] });
  },

  cancelSubscription: async (id) => {
    await api.delete(`/subscriptions/${id}`);
    set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub._id !== id) }));
  },

  fetchPatterns: async () => {
    const res = await safe(() => api.get('/ai/patterns'));
    if (res) set({ patterns: unwrap(res) });
  },

  fetchNetWorth: async () => {
    const res = await safe(() => api.get('/transactions/net-worth'));
    if (res) {
      const d = unwrap(res);
      set({ netWorthHistory: d?.netWorthHistory ?? [], currentNetWorth: d?.currentNetWorth ?? 0 });
    }
  },

  fetchRisks: async () => {
    const res = await safe(() => api.get('/risks'));
    if (res) set({ risks: unwrap(res) ?? [] });
  },
}));
