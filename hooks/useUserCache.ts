import { useEffect, useState } from 'react';
import { userCache } from '@/lib/utils/user-cache';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  permissions?: string[];
}

interface UseUserCacheOptions {
  revalidationInterval?: number;
  enabled?: boolean;
}

export function useUserCache(
  setUser: (user: User | null) => void,
  setIsLoading: (loading: boolean) => void,
  setHasCheckedAuth: (checked: boolean) => void,
  options: UseUserCacheOptions = {}
) {
  const { 
    revalidationInterval = 4 * 60 * 1000, // 4 minutes default
    enabled = true 
  } = options;
  
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [user, setInternalUser] = useState<User | null>(null);

  // Auto-cache user changes
  useEffect(() => {
    userCache.setCachedUser(user);
  }, [user]);

  // Check auth with caching logic
  const checkAuth = async (forceRefresh = false) => {
    try {
      // First, try to get cached user data for immediate display
      if (!forceRefresh) {
        const cachedUser = userCache.getCachedUser();
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

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setInternalUser(data.user);
          userCache.setCachedUser(data.user);
        } else {
          setUser(null);
          setInternalUser(null);
          userCache.setCachedUser(null);
        }
      } else {
        setUser(null);
        setInternalUser(null);
        userCache.setCachedUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setInternalUser(null);
      userCache.setCachedUser(null);
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
      setIsRevalidating(false);
    }
  };

  // Periodic session revalidation
  useEffect(() => {
    if (!enabled || !user || isRevalidating) return;

    const interval = setInterval(async () => {
      setIsRevalidating(true);
      try {
        await checkAuth(true); // Force refresh
      } catch (error) {
        console.error('Periodic revalidation failed:', error);
      }
    }, revalidationInterval);

    return () => clearInterval(interval);
  }, [user, isRevalidating, checkAuth, revalidationInterval, enabled]);

  return {
    checkAuth,
    isRevalidating,
    setIsRevalidating
  };
}
