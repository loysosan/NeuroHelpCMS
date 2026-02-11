import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verified: boolean;
}

interface UserAuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Перевіряємо токен при завантаженні
  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch('/api/users/self', { // ← Этот endpoint правильный
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Токен недійсний
        localStorage.removeItem('userToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('userToken');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Валидация
    if (!email || !password) {
      throw new Error('Email та пароль обов\'язкові для заповнення');
    }

    console.log('Sending login request with:', { email, password: '***' });

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: email.trim(), // Отправляем как "username" согласно бэкенду
        password: password 
      })
    });

    console.log('Login response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Помилка авторизації' }));
      throw new Error(errorData.message || 'Помилка авторизації');
    }

    const data = await response.json();
    console.log('Login response data:', data);
    
    // Исправляем получение токена - используем тот же подход, что и в старом фронтенде
    const authToken = data.access_token || data.token;
    
    if (!authToken) {
      throw new Error('Токен не отримано від сервера');
    }
    
    setToken(authToken);
    localStorage.setItem('userToken', authToken);
    
    // Отримуємо дані користувача
    await fetchUserProfile(authToken);
  };

  // Login with existing access token (used after Google OAuth)
  const loginWithToken = async (accessToken: string) => {
    setToken(accessToken);
    localStorage.setItem('userToken', accessToken);
    await fetchUserProfile(accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
  };

  const value: UserAuthContextType = {
    user,
    token,
    isLoading,
    login,
    loginWithToken,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return context;
};