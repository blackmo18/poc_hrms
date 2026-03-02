'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { useRoleAccess } from '../providers/role-access-provider';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

interface DashboardRouterProps {
  children: React.ReactNode;
}

export function DashboardRouter({ children }: DashboardRouterProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { roles, isLoading: roleLoading } = useRoleAccess();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Don't do anything while loading
    if (authLoading || roleLoading || isRedirecting) return;

    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user has administrative roles
    const hasAdminRole = ADMINSTRATIVE_ROLES.some(role => roles.includes(role));
    
    // If user has admin role and is not already on admin dashboard, redirect to admin dashboard
    if (hasAdminRole && window.location.pathname === '/dashboard') {
      setIsRedirecting(true);
      // Stay on current admin dashboard - no redirect needed
      return;
    }
    
    // If user doesn't have admin role and is on main dashboard, redirect to employee dashboard
    if (!hasAdminRole && window.location.pathname === '/dashboard') {
      setIsRedirecting(true);
      router.push('/dashboard/employee');
      return;
    }

  }, [user, authLoading, roleLoading, router, roles, isRedirecting]);

  // Show loading state
  if (authLoading || roleLoading || isRedirecting) {
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
