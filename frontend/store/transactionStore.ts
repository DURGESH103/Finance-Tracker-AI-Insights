import { create } from 'zustand';
import api from '@/lib/api';
import { Transaction, Analytics } from '@/types';

const unwrap = (res: any) => res.data?.data ?? res.data;

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

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  analytics: null,
  total: 0,
  pages: 1,
  loading: false,

  fetchTransactions: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/transactions', { params });
      const d = unwrap(res);
      set({ transactions: d.transactions ?? [], total: d.total ?? 0, pages: d.pages ?? 1 });
    } finally {
      // Always reset loading — even on error or 401 redirect
      set({ loading: false });
    }
  },

  fetchAnalytics: async () => {
    try {
      const res = await api.get('/transactions/analytics');
      set({ analytics: unwrap(res) });
    } catch (err: any) {
      if (err?.response?.status === 401) throw err;
      console.error('[transactionStore] fetchAnalytics:', err?.message);
    }
  },

  addTransaction: async (payload) => {
    const res = await api.post('/transactions', payload);
    const tx = unwrap(res);
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    return tx;
  },

  updateTransaction: async (id, payload) => {
    const res = await api.put(`/transactions/${id}`, payload);
    const tx = unwrap(res);
    set((s) => ({ transactions: s.transactions.map((t) => (t._id === id ? tx : t)) }));
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`);
    set((s) => ({ transactions: s.transactions.filter((t) => t._id !== id) }));
  },

  prependTransaction: (tx) => set((s) => ({
    transactions: [tx, ...s.transactions],
  })),
}));
