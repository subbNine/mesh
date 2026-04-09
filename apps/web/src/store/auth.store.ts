import { create } from 'zustand';
import { api } from '../lib/api';
import type { IUser } from '@mesh/shared';

type AuthResponse = {
  user: IUser;
  accessToken: string;
  redirectTo?: string | null;
  inviteError?: string | null;
};

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, inviteToken?: string) => Promise<AuthResponse>;
  register: (payload: any) => Promise<AuthResponse>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  updateUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,

  updateUser: (user) => set({ user }),

  login: async (email, password, inviteToken) => {
    const { data } = await api.post('/auth/login', { email, password, inviteToken });
    localStorage.setItem('token', data.accessToken);
    set({ user: data.user, token: data.accessToken });
    return data;
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.accessToken);
    set({ user: data.user, token: data.accessToken });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadFromStorage: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
