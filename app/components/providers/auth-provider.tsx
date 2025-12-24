'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserCache } from '@/hooks/useUserCache';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { sessionManager } from '@/lib/utils/session-manager';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
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
  organization_id: user.organization_id
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

  const { checkAuth } = useUserCache(setUser, setIsLoading, setHasCheckedAuth);

  // Cross-tab session synchronization
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((sessionData) => {
      if (sessionData) {
        if (sessionData.user === null) {
          // Session was invalidated by another tab - logout this tab
          console.log('Session invalidated by another tab, logging out...');
          setUser(null);
          router.push('/login');
        } else if (sessionData.user && !user) {
          // Another tab logged in - update this tab's state
          console.log('Session established by another tab, updating state...');
          setUser(sanitizeUser(sessionData.user));
        }
      }
    });

    return unsubscribe;
  }, [user, router]);

  // Idle timeout functionality - auto logout after 30 minutes of inactivity
  useEffect(() => {
    // Only check auth once on mount, not on every route change
    if (hasCheckedAuth) {
      setIsLoading(false);
      return;
    }

    checkAuth();
  }, [hasCheckedAuth]);

  // Redirect to login if user is null after auth check
  useEffect(() => {
    if (!user && hasCheckedAuth) {
      router.push('/login');
    }
  }, [user, hasCheckedAuth, router]);


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
        const session = await response.json();
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.username,
          organization_id: session.user.organization_id
        });
        // Store complete session with tokens in session manager
        sessionManager.setAuthenticatedUser(session.user, session.accessToken, session.refreshToken);
        // Fetch full user data including roles
        await checkAuth();
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
      // Notify other tabs about logout and clear session
      sessionManager.clearSession();

      // Call sign-out endpoint to clear server-side cookies
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });

      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if server logout fails
      setUser(null);
      sessionManager.clearSession();
    }
  };

  // Token refresh logic
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = sessionManager.getRefreshToken();
      if (!refreshToken) {
        // No refresh token means user needs to login again
        logout();
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update access token in session manager
        sessionManager.updateAccessToken(data.accessToken);
        setUser(sanitizeUser(data.user));
        return true;
      } else if (response.status === 401) {
        // 401 means refresh token is invalid/expired - user must login again
        console.error('Refresh token expired - requires login');
        logout();
        return false;
      } else {
        // Other errors (500, network issues, etc.) - don't logout immediately
        console.error('Token refresh failed with status:', response.status);
        return false;
      }
    } catch (error) {
      // Network errors or other issues - don't logout immediately
      console.error('Token refresh network error:', error);
      return false;
    }
  };

  // Get access token with auto-refresh
  const getAccessToken = async (): Promise<string | null> => {
    let token = sessionManager.getAccessToken();

    if (!token) return null;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      // If token expires in less than 5 minutes, refresh it
      if (payload.exp - now < 300) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          token = sessionManager.getAccessToken();
        } else {
          // Refresh failed but don't return null immediately
          // Return the existing token and let the API handle auth
          return token;
        }
      }
    } catch {
      // Token is malformed, return null
      return null;
    }

    useIdleTimeout(logout, user, {
      timeout: 12 * 60 * 1000, // 12 minutes
      promptBefore: 2 * 60 * 1000, // Warn 2 minutes before logout
      enabled: !!user // Only enable when user is logged in
    });

    return token;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, getAccessToken, checkAuth }}>
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
