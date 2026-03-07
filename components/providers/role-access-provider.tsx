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
  const { user, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use roles and permissions from session data instead of separate API call
  useEffect(() => {
    if (!user) {
      setRoles([]);
      setPermissions([]);
      return;
    }

    // Extract roles and permissions from user object (from session)
    // Note: This assumes the session endpoint includes roles and permissions
    const userRoles = (user as any).roles || [];
    const userPermissions = (user as any).permissions || [];
    
    setRoles(userRoles);
    setPermissions(userPermissions);
  }, [user]);

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (checkRoles: string[]) => checkRoles.some(role => roles.includes(role));
  const hasAllRoles = (checkRoles: string[]) => checkRoles.every(role => roles.includes(role));
  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasAnyPermission = (checkPermissions: string[]) => checkPermissions.some(permission => permissions.includes(permission));

  return (
    <RoleAccessContext.Provider value={{
      roles,
      permissions,
      isLoading: isLoading || authLoading,
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
