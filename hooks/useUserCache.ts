import { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/utils/session-manager';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  employeeId?: string;
}

interface UseUserCacheOptions {
  revalidationInterval?: number;
  enabled?: boolean;
  onUserNull?: () => void;
  isUserIdle?: () => boolean; // Function to check if user is idle
}

const sanitizeUser = (user: any): User => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    organizationId: user.organizationId || user.organizationId, // Handle both camelCase and snake_case
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles || [],
    permissions: user.permissions || [],
    employeeId: user.employeeId
  };
};

export function useUserCache(
  setUser: (user: User | null) => void,
  setIsLoading: (loading: boolean) => void,
  setHasCheckedAuth: (checked: boolean) => void,
  options: UseUserCacheOptions = {}
) {
  const { 
    revalidationInterval = 15 * 60 * 1000, // 15 minutes default (less intrusive)
    enabled = true,
    onUserNull,
    isUserIdle = () => false // Default to not idle
  } = options;
  
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [user, setInternalUser] = useState<User | null>(null);

  // Check auth with caching logic
  const checkAuth = async (forceRefresh = false) => {
    try {
      // Always validate session with server first - disable cache for testing
      const response = await fetch(`/api/auth/session?_t=${Date.now()}`, {
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
          // Note: roles and permissions are now fetched via /api/auth/roles-permissions
          // and managed by RoleAccessProvider, not stored here
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
      setUser(null);
      setInternalUser(null);
      onUserNull?.();
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
      setIsRevalidating(false);
    }
  };

  // Periodic session revalidation - only when user is idle
  useEffect(() => {
    if (!enabled || isRevalidating) return;

    const interval = setInterval(async () => {
      // Skip validation if user is active (not idle)
      if (!isUserIdle()) {
        return;
      }

      setIsRevalidating(true);
      try {
        await checkAuth(true); // Force refresh
      } catch (error) {
        // Periodic revalidation failed - continue with current session
      }
    }, revalidationInterval);

    return () => clearInterval(interval);
  }, [isRevalidating, checkAuth, revalidationInterval, enabled, isUserIdle]);

  return {
    checkAuth,
    isRevalidating,
    setIsRevalidating
  };
}
