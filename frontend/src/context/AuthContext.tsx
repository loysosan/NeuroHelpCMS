import React, {
  createContext,
  useContext,
  useState,
  ReactNode
} from 'react';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  token: string | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const navigate = useNavigate();

  const loginAdmin = async (email: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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