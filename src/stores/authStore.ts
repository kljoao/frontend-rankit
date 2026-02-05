import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';
import { api } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.login({ email, password });
        // @ts-ignore - Handle potential backend snake_case or PascalCase response
        const token = response.accessToken || response.token || response.access_token || response.AccessToken;

        if (!token) {
          throw new Error('Falha no login: Token não recebido do servidor');
        }

        localStorage.setItem('rankit_token', token);
        set({
          user: response.user,
          token: token,
          isAuthenticated: true,
        });
      },

      register: async (name: string, email: string, password: string) => {
        const response = await api.register({ name, email, password });
        // @ts-ignore - Handle potential backend snake_case or PascalCase response
        const token = response.accessToken || response.token || response.access_token || response.AccessToken;

        if (!token) {
          throw new Error('Falha no registro: Token não recebido do servidor');
        }

        localStorage.setItem('rankit_token', token);
        set({
          user: response.user,
          token: token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('rankit_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('rankit_token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const user = await api.getMe();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('rankit_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'rankit-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
