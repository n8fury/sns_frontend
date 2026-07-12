import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, setAuthToken } from '@/lib/api';
import type { LoginResponse, User } from '@/lib/types';

// Mirrored to a cookie (in addition to localStorage) so middleware.ts can
// read the auth state server-side for route protection.
export const TOKEN_COOKIE = 'sns_token';

function writeTokenCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } else {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const data = await api<LoginResponse>('/api/auth/login/', {
          method: 'POST',
          body: { email, password },
        });
        setAuthToken(data.token);
        writeTokenCookie(data.token);
        set({ token: data.token, user: data.user });
      },

      logout: async () => {
        try {
          await api('/api/auth/logout/', { method: 'POST' });
        } catch {
          // token already invalid server-side; still clear local state
        }
        setAuthToken(null);
        writeTokenCookie(null);
        set({ token: null, user: null });
      },
    }),
    {
      name: 'sns-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // After F5, re-arm the api client and refresh the cookie's lifetime.
        if (state?.token) {
          setAuthToken(state.token);
          writeTokenCookie(state.token);
        }
      },
    },
  ),
);
