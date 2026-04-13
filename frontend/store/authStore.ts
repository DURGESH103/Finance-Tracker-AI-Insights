import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleAuth: (data: { googleId: string; email: string; name: string; avatar?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const setToken = (token: string) => {
  if (typeof window !== 'undefined') localStorage.setItem('ft_token', token);
};

const clearToken = () => {
  if (typeof window !== 'undefined') localStorage.removeItem('ft_token');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const token = data.accessToken ?? data.token;
        setToken(token);
        set({ token, user: data.user });
      },

      register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        const token = data.accessToken ?? data.token;
        setToken(token);
        set({ token, user: data.user });
      },

      googleAuth: async (payload) => {
        const { data } = await api.post('/auth/google', payload);
        const token = data.accessToken ?? data.token;
        setToken(token);
        set({ token, user: data.user });
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore */ }
        clearToken();
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user ?? data });
        } catch {
          clearToken();
          set({ user: null, token: null });
        }
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
