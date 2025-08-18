import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AdminAuthCtx {
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
}

const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/admin/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newToken = data.token || data.access_token;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem('admin_token', newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      const saved = localStorage.getItem('admin_token');
      if (!saved) {
        const refreshed = await refreshToken();
        setIsLoading(false);
        if (!refreshed) setToken(null);
        return;
      }
      try {
        const verifyRes = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${saved}` }
        });
        if (verifyRes.ok) {
          setToken(saved);
        } else {
          const refreshed = await refreshToken();
          if (!refreshed) {
            localStorage.removeItem('admin_token');
            setToken(null);
          }
        }
      } catch {
        const refreshed = await refreshToken();
        if (!refreshed) {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    check();
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: email, password })
    });
    if (!res.ok) {
      let msg = 'Login failed';
      try {
        const err = await res.json();
        msg = err.message || msg;
      } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    const tk = data.token || data.access_token;
    if (!tk) throw new Error('No token in response');
    setToken(tk);
    localStorage.setItem('admin_token', tk);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setToken(null);
    // опціонально: fetch('/api/admin/logout', { method:'POST', credentials:'include' });
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, isLoading, login, logout, refreshToken }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth outside provider');
  return ctx;
};
