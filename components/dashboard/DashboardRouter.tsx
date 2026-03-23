'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { useRoleAccess } from '../providers/role-access-provider';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

interface DashboardRouterProps {
  children: React.ReactNode;
}

export function DashboardRouter({ children }: DashboardRouterProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname(); // Use Next.js hook instead of window.location
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Don't do anything while loading
    if (authLoading || isRedirecting) return;

    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user has administrative role - use single role check
    const hasAdminRole = ADMINSTRATIVE_ROLES.includes(user?.role || '');
    
    // Temporarily disable redirect logic for testing
    // TODO: Remove this after fixing the issue
    
  }, [user, authLoading, router, isRedirecting, pathname]); // Add pathname to dependencies

  // Show loading state
  if (authLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
