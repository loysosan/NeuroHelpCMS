import { useCallback } from 'react';
import { useUserAuth } from '../context/UserAuthContext';

export const useAuthenticatedFetch = () => {
  const { token, logout } = useUserAuth();

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Automatic logout on 401/403
    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('Сесія закінчилась. Будь ласка, увійдіть знову.');
    }

    return response;
  }, [token, logout]);

  return authenticatedFetch;
};

const fetchProfile = async () => {
  console.log('fetchProfile called');
  
  if (!token) {
    setError('Токен недоступний');
    setIsLoading(false);
    return;
  }

  try {
    const response = await authenticatedFetch('/api/users/self');

    if (!response.ok) {
      throw new Error('Не вдалося завантажити профіль');
    }

    const data = await response.json();

  } catch (err: any) {
    console.error('fetchProfile error:', err);
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};