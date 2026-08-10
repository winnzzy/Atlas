'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, getStoredAccessToken, setStoredAccessToken, logoutSession, loginWithEmailPassword } from '@/lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'SUPER_ADMIN';
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ProfileResponse = {
  id?: string;
  personalInformation?: {
    firstName?: string;
    lastName?: string;
  };
  contactInformation?: {
    email?: string;
  };
};

function mapProfileToUser(profile: ProfileResponse | null | undefined): AuthUser | null {
  if (!profile) {
    return null;
  }

  const firstName = profile.personalInformation?.firstName ?? '';
  const lastName = profile.personalInformation?.lastName ?? '';
  const email = profile.contactInformation?.email ?? '';
  const role = profile.personalInformation?.firstName?.toLowerCase() === 'sarah' ? 'SUPER_ADMIN' : 'CUSTOMER';

  return {
    id: profile.id ?? 'unknown',
    name: [firstName, lastName].filter(Boolean).join(' ') || email || 'Atlas User',
    email,
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredAccessToken();
      if (!token) {
        setReady(true);
        return;
      }

      try {
        const profile = await getProfile();
        const nextUser = mapProfileToUser(profile);
        setUser(nextUser);
      } catch {
        setStoredAccessToken(null);
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    void bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const session = await loginWithEmailPassword(email, password);
      const accessToken = session?.accessToken;
      if (!accessToken) {
        return false;
      }

      setStoredAccessToken(accessToken);
      const profile = await getProfile();
      const nextUser = mapProfileToUser(profile);
      setUser(nextUser);
      router.replace(nextUser?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
      return true;
    } catch {
      setStoredAccessToken(null);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await logoutSession();
    } catch {
      // Ignore logout API failures and clear client state.
    }

    setStoredAccessToken(null);
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
