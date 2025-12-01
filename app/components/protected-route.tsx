'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/auth-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Check role requirements
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to fallback path instead of 404 to avoid aggressive auth checks
      router.push(fallbackPath);
      return;
    }

    // Check permission requirements
    if (requiredPermission && user.permissions && !user.permissions.includes(requiredPermission)) {
      // Redirect to fallback path instead of 404 to avoid aggressive auth checks
      router.push(fallbackPath);
      return;
    }
  }, [user, isLoading, router, requiredRole, requiredPermission, fallbackPath]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  if (!user) {
    return null;
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  // Check permission requirements
  if (requiredPermission && user.permissions && !user.permissions.includes(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
