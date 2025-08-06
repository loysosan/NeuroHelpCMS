import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminAuthContextType {
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const savedToken = localStorage.getItem('admin_token');
      if (savedToken) {
        setToken(savedToken);
      }
      setIsLoading(false);
    };
    checkToken();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/admin-api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password: password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Помилка під час входу');
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
    <AdminAuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
