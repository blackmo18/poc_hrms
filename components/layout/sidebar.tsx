'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { useRoleAccess } from '@/components/providers/role-access-provider';
import { 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  DollarSign,
  UserCheck,
  LogOut,
  Clock,
  Home
} from 'lucide-react';

const allNavigation = [
  // Employee navigation
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    requiredPermissions: [] as string[],
    requiredRoles: [] as string[]
  },
  { 
    name: 'Overtime', 
    href: '/overtime', 
    icon: Clock,
    requiredPermissions: ['overtime.request'],
    requiredRoles: [] as string[]
  },
  { 
    name: 'Leave', 
    href: '/leave', 
    icon: Calendar,
    requiredPermissions: ['timeoff.request'],
    requiredRoles: [] as string[]
  },
  { 
    name: 'Timesheet', 
    href: '/timesheet', 
    icon: Clock,
    requiredPermissions: ['timesheet.own.read'],
    requiredRoles: [] as string[]
  },
  { 
    name: 'Documents', 
    href: '/documents', 
    icon: FileText,
    requiredPermissions: [],
    requiredRoles: [] as string[]
  },
  
  // Admin/HR navigation
  { 
    name: 'Employees', 
    href: '/employees', 
    icon: Users,
    requiredPermissions: ['employees.read'],
    requiredRoles: ['SUPER_ADMIN', 'HR_ADMIN']
  },
  { 
    name: 'Departments', 
    href: '/departments', 
    icon: Building2,
    requiredPermissions: ['employees.read'],
    requiredRoles: ['SUPER_ADMIN', 'HR_ADMIN']
  },
  { 
    name: 'Payroll', 
    href: '/payroll', 
    icon: DollarSign,
    requiredPermissions: ['payroll.read'],
    requiredRoles: ['SUPER_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN']
  },
  { 
    name: 'Leave Requests', 
    href: '/leave', 
    icon: Calendar,
    requiredPermissions: ['timeoff.approve'],
    requiredRoles: ['SUPER_ADMIN', 'HR_ADMIN']
  },
  { 
    name: 'Onboarding', 
    href: '/onboarding', 
    icon: UserCheck,
    requiredPermissions: ['employees.create'],
    requiredRoles: ['SUPER_ADMIN', 'HR_ADMIN']
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    requiredPermissions: ['users.update'],
    requiredRoles: ['SUPER_ADMIN']
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, hasRole, isLoading } = useRoleAccess();

  // Filter navigation based on user permissions and roles
  const navigation = allNavigation.filter(item => {
    // Show item if user has required permission OR required role
    const hasRequiredPermission = item.requiredPermissions.length === 0 || 
      item.requiredPermissions.some(permission => hasPermission(permission));
    
    const hasRequiredRole = item.requiredRoles.length === 0 || 
      item.requiredRoles.some(role => hasRole(role));
    
    return hasRequiredPermission || hasRequiredRole;
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-64 flex-col bg-gray-900">
        <div className="flex h-16 shrink-0 items-center px-4">
          <h1 className="text-white text-lg font-semibold">HR Management</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-4">
        <h1 className="text-white text-lg font-semibold">HR Management</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
