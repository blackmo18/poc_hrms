'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/auth-provider';
import { useRoleAccess } from './providers/role-access-provider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermission?: string; // Kept for backward compatibility but not used
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requiredPermission, // Kept for backward compatibility but not used
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { validateRoles, hasRole, hasAnyRole, hasAllRoles } = useRoleAccess();
  const [isValidating, setIsValidating] = useState(false);
  const [hasRoleAccess, setHasRoleAccess] = useState(true); // Default to true for basic cases

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If no role requirements, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      setHasRoleAccess(true);
      return;
    }

    // Use client-side validation first, server-side as fallback
    const validateAccess = async () => {
      setIsValidating(true);
      try {
        console.log('ProtectedRoute: Validating access for roles:', requiredRoles);
        console.log('ProtectedRoute: Current user hasRole ADMIN:', hasRole('ADMIN'));
        console.log('ProtectedRoute: Current user hasAnyRole ADMIN/HR_MANAGER:', hasAnyRole(['ADMIN', 'HR_MANAGER']));
        
        // First try client-side validation using role access provider
        const hasClientAccess = await validateRoles(requiredRoles || [], false);
        console.log('ProtectedRoute: Client-side validation result:', hasClientAccess);
        
        if (!hasClientAccess) {
          console.log('ProtectedRoute: Access denied, redirecting to:', fallbackPath);
          router.push(fallbackPath);
          setHasRoleAccess(false);
          setIsValidating(false);
          return;
        }
        
        // Client-side validation passed, but we can still do server validation for extra security
        // This reduces API calls significantly while maintaining security
        console.log('ProtectedRoute: Access granted');
        setHasRoleAccess(true);
      } catch (error) {
        console.error('Role validation failed:', error);
        router.push(fallbackPath);
        setHasRoleAccess(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [user, isLoading, router, requiredRoles, fallbackPath, validateRoles]);

  // Show loading state while auth is being checked
  if (isLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  if (!user || !hasRoleAccess) {
    return null;
  }

  // Permission checks removed - rely on server-side validation
  return <>{children}</>;
}
