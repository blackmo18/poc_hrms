'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/auth-provider';
import { useRoleAccess } from './providers/role-access-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermission?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requiredPermission,
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, roles } = useAuth();
  const { hasPermission, isLoading: roleLoading } = useRoleAccess();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading || roleLoading) return;

    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Check role requirements
    if (requiredRoles && !requiredRoles.some(role => roles.includes(role))) {
      // Redirect to fallback path instead of 404 to avoid aggressive auth checks
      router.push(fallbackPath);
      return;
    }

    // Check permission requirements
    if (requiredPermission && !hasPermission(requiredPermission)) {
      // Redirect to fallback path instead of 404 to avoid aggressive auth checks
      router.push(fallbackPath);
      return;
    }
  }, [user, isLoading, roleLoading, router, requiredRoles, requiredPermission, fallbackPath, hasPermission, roles]);

  // Show loading state
  if (isLoading || roleLoading) {
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
  if (requiredRoles && !requiredRoles.some(role => roles.includes(role))) {
    return null;
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
