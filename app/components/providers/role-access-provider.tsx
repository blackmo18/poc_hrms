'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-provider';

interface RoleAccessContextType {
  roles: string[];
  permissions: string[];
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const RoleAccessContext = createContext<RoleAccessContextType | undefined>(undefined);

export function RoleAccessProvider({ children }: { children: ReactNode }) {
  const { user, roles, permissions, isLoading: authLoading } = useAuth();

  const hasRole = (role: string) => roles.includes(role);

  const hasAnyRole = (requiredRoles: string[]) => requiredRoles.some(role => roles.includes(role));

  const hasAllRoles = (requiredRoles: string[]) => requiredRoles.every(role => roles.includes(role));

  const hasPermission = (permission: string) => permissions.includes(permission);

  const hasAnyPermission = (requiredPermissions: string[]) => requiredPermissions.some(perm => permissions.includes(perm));

  return (
    <RoleAccessContext.Provider value={{
      roles,
      permissions,
      isLoading: authLoading,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission
    }}>
      {children}
    </RoleAccessContext.Provider>
  );
}

export const useRoleAccess = () => {
  const context = useContext(RoleAccessContext);
  if (context === undefined) {
    throw new Error('useRoleAccess must be used within a RoleAccessProvider');
  }
  return context;
};
