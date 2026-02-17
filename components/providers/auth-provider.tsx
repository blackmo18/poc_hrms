'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserCache } from '@/hooks/useUserCache';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { sessionManager } from '@/lib/utils/session-manager';
import { setupFetchInterceptor, registerSessionInvalidationCallback } from '@/lib/utils/fetch-interceptor';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  organization_id?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  roles: string[]; // Kept for backward compatibility, but not used
  permissions: string[]; // Kept for backward compatibility, but not used
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  getAccessToken: () => Promise<string | null>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUser = (user: any): User => ({
  id: user.id,
  email: user.email,
  username: user.username,
  organization_id: user.organization_id,
  firstName: user.first_name,
  lastName: user.last_name
});

export function AuthProvider({
  children,
  initialUser = null
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true); // Always start loading, let checkAuth handle it
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const router = useRouter();

  const handleUserNull = () => {
    // Called when session validation fails
    setUser(null);
    // Redirect immediately if not on a public route
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const publicRoutes = ["/", "/signin", "/signup", "/login", "/test"];
    const isPublicRoute = publicRoutes.some((route) =>
      currentPath === route || currentPath.startsWith(route)
    );
    
    if (!isPublicRoute && typeof window !== 'undefined') {
      console.log('Session validation failed, redirecting to login from:', currentPath);
      router.push('/login');
    }
  };

  const handleSessionInvalidation = () => {
    // Called when 401 response is intercepted
    console.log('Session invalidated via 401 response, logging out');
    setUser(null);
    sessionManager.clearSession();
    router.push('/login');
  };

  // Cross-tab session synchronization
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((sessionData) => {
      if (sessionData) {
        if (sessionData.user === null) {
          // Session was invalidated by another tab - logout this tab
          setUser(null);
          router.push('/login');
        } else if (sessionData.user && !user) {
          // Another tab logged in - update this tab's state
          setUser(sanitizeUser(sessionData.user));
          // Roles and permissions will be fetched by RoleAccessProvider via API
        }
      }
    });

    return unsubscribe;
  }, [user, router]);

  // Setup fetch interceptor for 401 responses
  useEffect(() => {
    setupFetchInterceptor();
    registerSessionInvalidationCallback(handleSessionInvalidation);
  }, []);

  // Idle timeout functionality - auto logout after 30 minutes of inactivity
  useEffect(() => {
    // Only check auth once on mount, not on every route change
    if (hasCheckedAuth) {
      setIsLoading(false);
      return;
    }

    checkAuth();
  }, [hasCheckedAuth]);

  // Redirect to login if user is null after auth check (skip for public routes)
  useEffect(() => {
    if (!user && hasCheckedAuth) {
      // Check if current route is public
      const currentPath = window.location.pathname;
      const publicRoutes = ["/", "/signin", "/signup", "/login", "/test"];

      const isPublicRoute = publicRoutes.some((route) =>
        currentPath === route || currentPath.startsWith(route)
      );

      if (!isPublicRoute) {
        console.log('Session invalid or expired, redirecting to login from:', currentPath);
        router.push('/login');
      }
    }
  }, [user, hasCheckedAuth, router]);

  // Immediate redirect on session validation failure (before hasCheckedAuth is set)
  useEffect(() => {
    if (isLoading === false && !user && hasCheckedAuth) {
      const currentPath = window.location.pathname;
      const publicRoutes = ["/", "/signin", "/signup", "/login", "/test"];
      const isPublicRoute = publicRoutes.some((route) =>
        currentPath === route || currentPath.startsWith(route)
      );
      
      if (!isPublicRoute) {
        console.log('Immediate redirect triggered for:', currentPath);
        router.push('/login');
      }
    }
  }, [isLoading, user, hasCheckedAuth, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email,
          organization_id: data.user.organizationId
        };
        setUser(userData);
        
        // Fetch full user data via session endpoint for verification
        // Roles and permissions will be fetched separately via /api/auth/roles-permissions
        await checkAuth();
        
        // Small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Store session in session manager for persistence (only basic user info, no sensitive data)
        sessionManager.setAuthenticatedUser(
          {
            id: data.user.id,
            email: data.user.email,
            username: data.user.email
          },
          '', // accessToken (managed by cookie)
          ''  // refreshToken (managed by cookie)
        );
        
        // Redirect to dashboard after successful login
        router.push('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

    } catch (error) {
      // Re-throw the error to be caught by the login page
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setUser(null);
      setIsLoading(false);
      
      // Notify other tabs about logout and clear session
      sessionManager.clearSession();

      // Call sign-out endpoint to clear server-side cookies and database session
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if server logout fails
      setUser(null);
      setIsLoading(false);
      sessionManager.clearSession();
    }
  };

  const { getIdleStatus } = useIdleTimeout(logout, user, {
    timeout: 30 * 60 * 1000, // 30 minutes
    promptBefore: 5 * 60 * 1000, // 5 minutes
    enabled: !!user
  });

  // Update checkAuth with proper isUserIdle function
  const { checkAuth } = useUserCache(setUser, setIsLoading, setHasCheckedAuth, {
    onUserNull: handleUserNull,
    isUserIdle: () => {
      const status = getIdleStatus();
      return status ? status.idleTime > 5 * 60 * 1000 : false; // Consider idle after 5 minutes
    }
  });

  // Get access token - Better-Auth manages tokens via cookies
  const getAccessToken = async (): Promise<string | null> => {
    // Better-Auth manages session via HTTP-only cookies
    // No need to manually handle tokens
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, roles: [], permissions: [], login, logout, isLoading, getAccessToken, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
