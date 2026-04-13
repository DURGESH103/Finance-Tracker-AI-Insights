import { create } from 'zustand';
import api from '@/lib/api';
import { Budget, Insight } from '@/types';

interface FinanceState {
  budgets: Budget[];
  insights: Insight[];
  prediction: number | null;
  fetchBudgets: () => Promise<void>;
  addBudget: (data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  fetchInsights: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  fetchPrediction: () => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  budgets: [],
  insights: [],
  prediction: null,

  fetchBudgets: async () => {
    const { data } = await api.get('/budgets');
    set({ budgets: data });
  },

  addBudget: async (payload) => {
    const { data } = await api.post('/budgets', payload);
    set((s) => ({ budgets: [...s.budgets.filter((b) => b._id !== data._id), data] }));
  },

  deleteBudget: async (id) => {
    await api.delete(`/budgets/${id}`);
    set((s) => ({ budgets: s.budgets.filter((b) => b._id !== id) }));
  },

  fetchInsights: async () => {
    const { data } = await api.get('/ai');
    set({ insights: data });
  },

  refreshInsights: async () => {
    const { data } = await api.post('/ai/refresh');
    set({ insights: data });
  },

  fetchPrediction: async () => {
    const { data } = await api.get('/ai/predict');
    set({ prediction: data.predictedAmount });
  },
}));
