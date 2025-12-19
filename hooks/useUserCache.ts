import { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/utils/session-manager';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  organization_id?: number;
}

interface UseUserCacheOptions {
  revalidationInterval?: number;
  enabled?: boolean;
  onUserNull?: () => void;
}

export function useUserCache(
  setUser: (user: User | null) => void,
  setIsLoading: (loading: boolean) => void,
  setHasCheckedAuth: (checked: boolean) => void,
  options: UseUserCacheOptions = {}
) {
  const { 
    revalidationInterval = 4 * 60 * 1000, // 4 minutes default
    enabled = true,
    onUserNull
  } = options;
  
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [user, setInternalUser] = useState<User | null>(null);

  // Check auth with caching logic
  const checkAuth = async (forceRefresh = false) => {
    try {
      // First, try to get cached user data for immediate display
      if (!forceRefresh) {
        const sessionData = sessionManager.getSessionData();
        const cachedUser = sessionData?.user;
        if (cachedUser) {
          setUser(cachedUser);
          setInternalUser(cachedUser);
          setIsLoading(false);
        }
      }

      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('Auth response: ', response);

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setInternalUser(data.user);
        } else {
          setUser(null);
          setInternalUser(null);
          onUserNull?.();
        }
      } else {
        setUser(null);
        setInternalUser(null);
        onUserNull?.();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setInternalUser(null);
      onUserNull?.();
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
      setIsRevalidating(false);
    }
  };

  // Periodic session revalidation
  useEffect(() => {
    console.log('Revalidating session...');
    if (!enabled || isRevalidating) return;

    const interval = setInterval(async () => {
      setIsRevalidating(true);
      try {
        await checkAuth(true); // Force refresh
      } catch (error) {
        console.error('Periodic revalidation failed:', error);
      }
    }, revalidationInterval);

    return () => clearInterval(interval);
  }, [isRevalidating, checkAuth, revalidationInterval, enabled]);

  return {
    checkAuth,
    isRevalidating,
    setIsRevalidating
  };
}
