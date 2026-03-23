'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-provider';

interface RoleAccessContextType {
  roles: string[]; // Kept for backward compatibility, derived from user.role
  permissions: string[]; // Kept for backward compatibility, but always empty
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean; // Always returns false - permissions removed
  hasAnyPermission: (permissions: string[]) => boolean; // Always returns false - permissions removed
  validateRoles: (requiredRoles: string[], requireAll?: boolean) => Promise<boolean>; // Server-side validation
}

const RoleAccessContext = createContext<RoleAccessContextType | undefined>(undefined);

export function RoleAccessProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use role from user object instead of separate API call
  useEffect(() => {
    if (!user) {
      setRoles([]);
      setPermissions([]);
      return;
    }

    // Extract role from user object (from session) - convert single role to array for compatibility
    const userRole = (user as any).role;
    const userRoles = userRole ? [userRole] : [];
    
    setRoles(userRoles);
    setPermissions([]); // Always empty - permissions removed from client
  }, [user]);

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (checkRoles: string[]) => checkRoles.some(role => roles.includes(role));
  const hasAllRoles = (checkRoles: string[]) => checkRoles.every(role => roles.includes(role));
  const hasPermission = (permission: string) => false; // Always false - permissions removed from client
  const hasAnyPermission = (checkPermissions: string[]) => false; // Always false - permissions removed from client

  // Server-side role validation for multi-role support
  const validateRoles = async (requiredRoles: string[], requireAll = false): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/roles/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: requiredRoles, requireAll }),
        credentials: 'include'
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.hasAccess;
    } catch (error) {
      console.error('Role validation failed:', error);
      return false;
    }
  };

  return (
    <RoleAccessContext.Provider value={{
      roles,
      permissions,
      isLoading: isLoading || authLoading,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission,
      validateRoles
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
