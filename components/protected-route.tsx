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

    // Use server-side validation for multi-role support
    const validateAccess = async () => {
      setIsValidating(true);
      try {
        const response = await fetch('/api/auth/roles/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: requiredRoles, requireAll: false }),
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (!data.hasAccess) {
            router.push(fallbackPath);
          }
          setHasRoleAccess(data.hasAccess);
        } else {
          router.push(fallbackPath);
          setHasRoleAccess(false);
        }
      } catch (error) {
        console.error('Role validation failed:', error);
        router.push(fallbackPath);
        setHasRoleAccess(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [user, isLoading, router, requiredRoles, fallbackPath]);

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
