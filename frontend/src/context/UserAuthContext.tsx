import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

type UserAuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const useUserAuth = (): UserAuthContextType => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
};

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('user_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Функция для очистки токена
  const clearToken = useCallback(() => {
    setToken(null);
    localStorage.removeItem('user_token');
  }, []);

  // Функция для проверки валидности токена
  const validateToken = useCallback(async (tokenToValidate: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/users/self', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Token validation failed:', response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const checkToken = async () => {
      const storedToken = localStorage.getItem('user_token');
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const isValid = await validateToken(storedToken);
      
      if (isValid) {
        setToken(storedToken);
      } else {
        // Токен недействителен - очищаем его
        clearToken();
      }
      
      setIsLoading(false);
    };

    checkToken();
  }, [validateToken, clearToken]);

  // Обработчик ответов API для автоматического выхода при 401/403
  const handleApiResponse = useCallback((response: Response) => {
    if (response.status === 401 || response.status === 403) {
      console.log('Unauthorized response received, logging out');
      clearToken();
    }
  }, [clearToken]);

  // Глобальный перехватчик fetch (опционально)
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Проверяем только запросы с токеном авторизации
      const [url, options] = args;
      const hasAuthHeader = options?.headers && 
        (typeof options.headers === 'object' && 'Authorization' in options.headers);
      
      if (hasAuthHeader) {
        handleApiResponse(response.clone());
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [handleApiResponse]);

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
    clearToken();
  };

  const isAuthenticated = !!token && !isLoading;

  return (
    <UserAuthContext.Provider value={{ 
      token, 
      login, 
      logout, 
      isAuthenticated, 
      isLoading 
    }}>
      {children}
    </UserAuthContext.Provider>
  );
};