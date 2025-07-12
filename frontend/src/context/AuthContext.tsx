import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  token: string | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Функция для обновления токена
  const refreshToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/admin/refresh', {
        method: 'POST',
        credentials: 'include', // Важно для отправки cookies
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  };

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const checkToken = async () => {
      const savedToken = localStorage.getItem('admin_token');
      
      if (!savedToken) {
        // Попробуем обновить токен через refresh token
        const newToken = await refreshToken();
        if (newToken) {
          setToken(newToken);
          localStorage.setItem('admin_token', newToken);
        }
        setIsLoading(false);
        return;
      }

      try {
        // Проверяем валидность токена
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });

        if (response.ok) {
          // Токен валидный
          setToken(savedToken);
        } else {
          // Токен невалидный - пробуем обновить
          const newToken = await refreshToken();
          if (newToken) {
            setToken(newToken);
            localStorage.setItem('admin_token', newToken);
          } else {
            // Удаляем невалидный токен
            localStorage.removeItem('admin_token');
            setToken(null);
          }
        }
      } catch (error) {
        // Ошибка при проверке - пробуем обновить токен
        const newToken = await refreshToken();
        if (newToken) {
          setToken(newToken);
          localStorage.setItem('admin_token', newToken);
        } else {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Важно для получения cookies
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
    
    // Очищаем refresh token cookie
    document.cookie = 'admin_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    navigate('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ token, loginAdmin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};