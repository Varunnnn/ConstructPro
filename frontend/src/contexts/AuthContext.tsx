import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Organization } from '../types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (email: string, fullName: string, firebaseUid?: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  /** Re-fetches user + org (including plan) from /api/auth/me */
  refreshMe: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  company_name: string;
  mobile: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetch current user+org from server; syncs plan from subscription table */
  const refreshMe = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
      setOrganization(res.data.data.organization);
    } catch {
      // Token invalid — clear session
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setOrganization(null);
    }
  }, []);

  // On mount, restore session by calling /me (also syncs plan from DB)
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { access_token, refresh_token, user, organization } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
    setOrganization(organization);
    // Immediately fetch from /me so plan is fresh from the subscription table
    try {
      const meRes = await authApi.me();
      setUser(meRes.data.data.user);
      setOrganization(meRes.data.data.organization);
    } catch {
      // fallback to login response data already set above
    }
    return user;
  }, []);

  const loginWithGoogle = useCallback(async (email: string, fullName: string, firebaseUid?: string) => {
    const res = await authApi.googleLogin({ email, full_name: fullName, firebase_uid: firebaseUid });
    const { access_token, refresh_token, user, organization } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
    setOrganization(organization);
    try {
      const meRes = await authApi.me();
      setUser(meRes.data.data.user);
      setOrganization(meRes.data.data.organization);
    } catch {
      // fallback
    }
    return user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    const { access_token, refresh_token, user, organization } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
    setOrganization(organization);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setOrganization(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
