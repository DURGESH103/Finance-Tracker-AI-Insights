import { create } from 'zustand';
import api from '@/lib/api';
import { Investment } from '@/types';

interface Portfolio {
  totalInvested: number;
  currentValue: number;
  pnl: number;
  pnlPct: string;
}

interface InvestmentState {
  investments: Investment[];
  portfolio: Portfolio | null;
  loading: boolean;
  fetchInvestments: () => Promise<void>;
  addInvestment: (data: Partial<Investment>) => Promise<void>;
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
}

export const useInvestmentStore = create<InvestmentState>((set) => ({
  investments: [],
  portfolio: null,
  loading: false,

  fetchInvestments: async () => {
    set({ loading: true });
    const { data } = await api.get('/investments');
    set({ investments: data.investments, portfolio: data.portfolio, loading: false });
  },

  addInvestment: async (payload) => {
    const { data } = await api.post('/investments', payload);
    set((s) => ({ investments: [data, ...s.investments] }));
  },

  updateInvestment: async (id, payload) => {
    const { data } = await api.put(`/investments/${id}`, payload);
    set((s) => ({ investments: s.investments.map((i) => (i._id === id ? data : i)) }));
  },

  deleteInvestment: async (id) => {
    await api.delete(`/investments/${id}`);
    set((s) => ({ investments: s.investments.filter((i) => i._id !== id) }));
  },
}));
