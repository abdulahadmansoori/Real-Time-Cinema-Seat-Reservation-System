"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setAuth,
  type StoredUser,
} from "@/lib/auth-storage";
import type { AuthResponse } from "@cinema/shared";

type AuthContextValue = {
  user: StoredUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setAuth(res.token, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setAuth(res.token, res.user);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export function useRequireAuth() {
  const auth = useAuth();
  return { ...auth, ready: !auth.loading && !!getToken() && !!auth.user };
}
