import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { authApi, registerSessionUpdateListener } from '@/services/api';
import type { AvailableRole, Session } from '@/types';

const SESSION_KEY = 'hostin.session';
const supportedRoles = new Set(['owner', 'warden', 'guard', 'staff', 'tenant', 'parent', 'platform']);

function parseSession(stored: string | null): Session | null {
  if (!stored) return null;
  try {
    const value = JSON.parse(stored) as Session;
    return value?.user?.role && supportedRoles.has(value.user.role) ? value : null;
  } catch {
    return null;
  }
}

const sessionStorage = {
  getItemAsync: (key: string) => Platform.OS === 'web'
    ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null)
    : SecureStore.getItemAsync(key),
  setItemAsync: (key: string, value: string) => Platform.OS === 'web'
    ? Promise.resolve(globalThis.localStorage?.setItem(key, value))
    : SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key: string) => Platform.OS === 'web'
    ? Promise.resolve(globalThis.localStorage?.removeItem(key))
    : SecureStore.deleteItemAsync(key),
};

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: AvailableRole) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sessionStorage.getItemAsync(SESSION_KEY)
      .then(async (stored) => {
        const restored = parseSession(stored);
        if (stored && !restored) await sessionStorage.deleteItemAsync(SESSION_KEY);
        setSession(restored);
      })
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    registerSessionUpdateListener((nextSession) => {
      void sessionStorage.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    });
    return () => registerSessionUpdateListener(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    isLoading,
    signIn: async (email, password) => {
      const nextSession = await authApi.login(email, password);
      await sessionStorage.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    },
    signOut: async () => {
      if (session) await authApi.logout(session).catch(() => undefined);
      await sessionStorage.deleteItemAsync(SESSION_KEY);
      setSession(null);
    },
    switchRole: async (role) => {
      if (!session) return;
      const nextSession: Session = {
        ...session,
        orgId: role.orgId,
        workspace: role.workspace,
        accountSlug: role.accountSlug,
        user: { ...session.user, role: role.role },
      };
      await sessionStorage.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    },
    changePassword: async (password) => {
      if (!session) return;
      await authApi.changePassword(session, password);
      const nextSession = { ...session, requiresPasswordChange: false };
      await sessionStorage.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    },
  }), [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
