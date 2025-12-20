'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth-provider';

interface RoleComponentWrapperProps {
  children: React.ReactNode;
  roles?: string[];
  requireAll?: boolean; // If true, user must have ALL roles; if false, user must have ANY role
  fallbackMessage?: string;
  showFallback?: boolean;
  fallback?: React.ReactNode; // Custom fallback component to render when user doesn't have access
}

export default function RoleComponentWrapper({
  children,
  roles: requiredRoles = ['ADMIN'],
  requireAll = false,
  fallbackMessage = 'Required permissions not available.',
  showFallback = true,
  fallback
}: RoleComponentWrapperProps) {
  const { user, isLoading } = useAuth();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user has required roles
      const userRoles = user.roles || [];

      // If no roles are required, deny access
      if (!requiredRoles || requiredRoles.length === 0) {
        setHasAccess(false);
        setHasCheckedRole(true);
        return;
      }

      // Check if user has at least one of the required roles
      const hasAtLeastOneRequiredRole = requiredRoles.some(role =>
        userRoles.includes(role)
      );

      let hasRequiredRole = false;
      if (requireAll) {
        // User must have ALL required roles
        hasRequiredRole = requiredRoles.every(role => userRoles.includes(role));
      } else {
        // User must have AT LEAST ONE of the required roles
        hasRequiredRole = hasAtLeastOneRequiredRole;
      }

      setHasAccess(hasRequiredRole);
      setHasCheckedRole(true);
    } else if (!isLoading && !user) {
      // No user logged in
      setHasAccess(false);
      setHasCheckedRole(true);
    }
  }, [user, isLoading, requiredRoles, requireAll]);

  // Show loading state while checking authentication/role
  if (isLoading || !hasCheckedRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">
          Checking permissions...
        </div>
      </div>
    );
  }

  // Show content if user has required access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback component if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show fallback message if user doesn't have required roles
  if (showFallback) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-2">
            Access Denied
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            {fallbackMessage}
          </div>
        </div>
      </div>
    );
  }

  // Return nothing if showFallback is false
  return null;
}
