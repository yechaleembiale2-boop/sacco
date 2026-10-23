'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from './api';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  memberId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    apiFetch<{
      id: string;
      username: string;
      role: string;
      memberId: string | null;
    }>('/auth/me')
      .then((u) =>
        setUser({
          id: u.id,
          username: u.username,
          role: u.role,
          memberId: u.memberId,
        }),
      )
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (username: string, password: string, totpCode?: string) => {
      // Build payload with optional TOTP code
      const payload: Record<string, string> = { username, password };
      if (totpCode) payload.totpCode = totpCode;

      const res = await apiFetch<{
        accessToken?: string;
        user?: AuthUser;
        mfaRequired?: boolean;
        userId?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Handle MFA required
      if (res.mfaRequired) {
        throw new Error('MFA_REQUIRED');
      }

      // Success
      if (!res.accessToken || !res.user) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem('token', res.accessToken);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}