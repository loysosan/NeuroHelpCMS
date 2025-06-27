import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type UserAuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const useUserAuth = (): UserAuthContextType => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
};

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('user_token'));

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login error');
    }
    const data = await res.json();
    const accessToken: string = data.access_token || data.token;
    setToken(accessToken);
    localStorage.setItem('user_token', accessToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('user_token');
  };

  const isAuthenticated = !!token;

  return (
    <UserAuthContext.Provider value={{ token, login, logout, isAuthenticated }}>
      {children}
    </UserAuthContext.Provider>
  );
};