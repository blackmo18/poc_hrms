'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth-provider';
import { useRoleAccess } from '../providers/role-access-provider';

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
  const { user, isLoading: authLoading } = useAuth();
  const { hasAnyRole, hasAllRoles, isLoading: rolesLoading } = useRoleAccess();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!rolesLoading && !authLoading) {
      // If no roles are required, deny access
      if (!requiredRoles || requiredRoles.length === 0) {
        setHasAccess(false);
        setHasCheckedRole(true);
        return;
      }

      // Check access based on requireAll flag
      const accessGranted = requireAll
        ? hasAllRoles(requiredRoles)
        : hasAnyRole(requiredRoles);

      setHasAccess(accessGranted);
      setHasCheckedRole(true);
    }
  }, [requiredRoles, requireAll, hasAnyRole, hasAllRoles, rolesLoading, authLoading]);

  // Show loading state while checking authentication/role
  if (authLoading || rolesLoading || !hasCheckedRole) {
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
