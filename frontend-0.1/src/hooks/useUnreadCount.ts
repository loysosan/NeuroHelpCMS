import { useCallback, useEffect, useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { getUnreadCount } from '../api/user/chat';

const POLL_INTERVAL_MS = 30_000;

export function useUnreadCount(): number {
  const { isAuthenticated } = useUserAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    try {
      const n = await getUnreadCount();
      setCount(n);
    } catch {
      // ignore network errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return count;
}
