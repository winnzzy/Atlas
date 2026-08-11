'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminIdentity,
  getProfile,
  getStoredAccessToken,
  setStoredAccessToken,
  logoutSession,
  loginWithEmailPassword,
  type AdminIdentity,
} from '@/lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  admin: AdminIdentity | null;
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

  return {
    id: profile.id ?? 'unknown',
    name: [firstName, lastName].filter(Boolean).join(' ') || email || 'Atlas User',
    email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // The admin grant is resolved server-side against the admin_users table; the
  // client only mirrors the answer.
  const loadSession = async () => {
    const profile = await getProfile();
    const nextUser = mapProfileToUser(profile);
    const nextAdmin = await getAdminIdentity();
    setUser(nextUser);
    setAdmin(nextAdmin);
    return { nextUser, nextAdmin };
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredAccessToken();
      if (!token) {
        setReady(true);
        return;
      }

      try {
        await loadSession();
      } catch {
        setStoredAccessToken(null);
        setUser(null);
        setAdmin(null);
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
      const { nextAdmin } = await loadSession();
      router.replace(nextAdmin ? '/admin' : '/dashboard');
      return true;
    } catch {
      setStoredAccessToken(null);
      setUser(null);
      setAdmin(null);
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
    setAdmin(null);
    router.replace('/login');
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      admin,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(admin),
      login,
      logout,
      ready,
    }),
    [user, admin, ready],
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
