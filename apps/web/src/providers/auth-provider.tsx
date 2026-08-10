'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, login as loginUser, logout as logoutUser } from '@/lib/demo-store';
import type { User } from '@/lib/demo-data';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
    setReady(true);
  }, []);

  const login = (email: string, password: string) => {
    const nextUser = loginUser(email, password);
    if (nextUser) {
      setUser(nextUser);
      router.replace(nextUser.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    router.replace('/login');
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'SUPER_ADMIN',
      login,
      logout,
      ready,
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
