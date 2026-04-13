import { create } from 'zustand';
import api from '@/lib/api';
import { Goal } from '@/types';

interface GoalState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (data: Partial<Goal>) => Promise<void>;
  contribute: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    const { data } = await api.get('/goals');
    set({ goals: data, loading: false });
  },

  addGoal: async (payload) => {
    const { data } = await api.post('/goals', payload);
    set((s) => ({ goals: [data, ...s.goals] }));
  },

  contribute: async (id, amount) => {
    const { data } = await api.post(`/goals/${id}/contribute`, { amount });
    set((s) => ({ goals: s.goals.map((g) => (g._id === id ? data : g)) }));
  },

  deleteGoal: async (id) => {
    await api.delete(`/goals/${id}`);
    set((s) => ({ goals: s.goals.filter((g) => g._id !== id) }));
  },
}));
