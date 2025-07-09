import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  token: string | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "username": email, "password": password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Помилка під час логіну');
    }

    const data = await res.json();
    const accessToken: string = data.token;
    setToken(accessToken);
    localStorage.setItem('admin_token', accessToken);
    navigate('/admin/dashboard');
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ token, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};