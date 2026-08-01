'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { localDataProvider, type LoggedInUser } from '@/features/mock/local-data-provider';

interface AuthContextValue {
  user: LoggedInUser | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (input: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<LoggedInUser | null>(() => localDataProvider.getCurrentUser());
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setUser(localDataProvider.getCurrentUser());
    setReady(true);
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const response = localDataProvider.authenticate(email, password);
    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message ?? 'Unable to sign in.' };
    }
    setUser(response.data.user);
    router.push(response.data.user.role === 'CUSTOMER' ? '/dashboard' : '/admin');
    return { success: true };
  }, [router]);

  const signUp = React.useCallback(async (input: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = localDataProvider.signUp({
      ...input,
      termsAcceptedAt: new Date().toISOString(),
      privacyAcceptedAt: new Date().toISOString(),
    });
    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message ?? 'Unable to create your account.' };
    }
    setUser(response.data.user);
    router.push('/dashboard');
    return { success: true };
  }, [router]);

  const forgotPassword = React.useCallback(async (email: string) => {
    const response = localDataProvider.forgotPassword(email);
    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message ?? 'Unable to process that request.' };
    }
    return { success: true, message: response.data.message };
  }, []);

  const resetPassword = React.useCallback(async (token: string, password: string) => {
    const response = localDataProvider.resetPassword(token, password);
    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message ?? 'Unable to reset your password.' };
    }
    return { success: true, message: response.data.message };
  }, []);

  const logout = React.useCallback(async () => {
    localDataProvider.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  React.useEffect(() => {
    if (!ready) return;
    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    if (!user && isProtectedRoute) {
      router.replace('/login');
      return;
    }
    if (user && isAuthRoute) {
      router.replace(user.role === 'CUSTOMER' ? '/dashboard' : '/admin');
    }
  }, [pathname, ready, router, user]);

  const value = React.useMemo<AuthContextValue>(() => ({
    user,
    signIn,
    signUp,
    forgotPassword,
    resetPassword,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
  }), [user, signIn, signUp, forgotPassword, resetPassword, logout]);

  if (!ready) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
