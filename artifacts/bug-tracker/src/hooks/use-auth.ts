import { useState, useEffect, useCallback } from "react";

interface AuthState {
  authenticated: boolean;
  username: string | null;
  loading: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ authenticated: false, username: null, loading: true });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setAuth({ authenticated: data.authenticated, username: data.username ?? null, loading: false });
    } catch {
      setAuth({ authenticated: false, username: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setAuth({ authenticated: true, username: data.username, loading: false });
      return null;
    }
    return "Invalid username or password.";
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuth({ authenticated: false, username: null, loading: false });
  }, []);

  return { ...auth, login, logout, checkAuth };
}
