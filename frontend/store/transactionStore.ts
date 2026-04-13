import { create } from 'zustand';
import api from '@/lib/api';
import { Transaction, Analytics } from '@/types';

interface TransactionState {
  transactions: Transaction[];
  analytics: Analytics | null;
  total: number;
  pages: number;
  loading: boolean;
  fetchTransactions: (params?: Record<string, string | number>) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  addTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  prependTransaction: (tx: Transaction) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  analytics: null,
  total: 0,
  pages: 1,
  loading: false,

  fetchTransactions: async (params = {}) => {
    set({ loading: true });
    const { data } = await api.get('/transactions', { params });
    set({ transactions: data.transactions, total: data.total, pages: data.pages, loading: false });
  },

  fetchAnalytics: async () => {
    const { data } = await api.get('/transactions/analytics');
    set({ analytics: data });
  },

  addTransaction: async (payload) => {
    const { data } = await api.post('/transactions', payload);
    set((s) => ({ transactions: [data, ...s.transactions] }));
    return data;
  },

  updateTransaction: async (id, payload) => {
    const { data } = await api.put(`/transactions/${id}`, payload);
    set((s) => ({ transactions: s.transactions.map((t) => (t._id === id ? data : t)) }));
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`);
    set((s) => ({ transactions: s.transactions.filter((t) => t._id !== id) }));
  },

  prependTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
}));
