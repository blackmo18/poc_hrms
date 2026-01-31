import { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/utils/session-manager';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  organization_id?: string;
  firstName?: string;
  lastName?: string;
}

interface UseUserCacheOptions {
  revalidationInterval?: number;
  enabled?: boolean;
  onUserNull?: () => void;
}

const sanitizeUser = (user: any): User => ({
  id: user.id,
  email: user.email,
  username: user.username,
  organization_id: user.organization_id,
  firstName: user.firstName,
  lastName: user.lastName
});

export function useUserCache(
  setUser: (user: User | null) => void,
  setRoles: (roles: string[]) => void,
  setPermissions: (permissions: string[]) => void,
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
      // Always validate session with server first on initial load
      // Only use cache for subsequent revalidations
      const isInitialCheck = !forceRefresh && user === null;
      
      if (!isInitialCheck && !forceRefresh) {
        // For revalidations (not initial check), show cached data while fetching
        const sessionData = sessionManager.getSessionData();
        const cachedUser = sessionData?.user;
        if (cachedUser) {
          const sanitized = sanitizeUser(cachedUser);
          setUser(sanitized);
          setInternalUser(sanitized);
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
          const sanitized = sanitizeUser(data.user);
          setUser(sanitized);
          setInternalUser(sanitized);
          setRoles(data.user.roles || []);
          setPermissions(data.user.permissions || []);
        } else {
          // Session endpoint returned no user - invalid session
          setUser(null);
          setInternalUser(null);
          onUserNull?.();
        }
      } else {
        // Session endpoint returned error - invalid session
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
