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
  
  // Role validation cache
  const [validationCache, setValidationCache] = useState<Map<string, boolean>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);

  // Clear cache when user changes
  useEffect(() => {
    setValidationCache(new Map());
    setCacheTimestamp(0);
  }, [user]);

  // Use roles from user object instead of separate API call
  useEffect(() => {
    if (!user) {
      setRoles([]);
      setPermissions([]);
      return;
    }

    // Extract roles from user object (now includes all roles from JWT)
    const userRoles = (user as any).roles || [];
    console.log('RoleAccessProvider: Setting roles from user object:', userRoles);
    
    setRoles(userRoles);
    setPermissions([]); // Always empty - permissions removed from client
  }, [user]);

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (checkRoles: string[]) => checkRoles.some(role => roles.includes(role));
  const hasAllRoles = (checkRoles: string[]) => checkRoles.every(role => roles.includes(role));
  const hasPermission = (permission: string) => false; // Always false - permissions removed from client
  const hasAnyPermission = (checkPermissions: string[]) => false; // Always false - permissions removed from client

  // Server-side role validation with caching
  const validateRoles = async (requiredRoles: string[], requireAll = false): Promise<boolean> => {
    // First try client-side validation using roles from JWT
    if (roles.length > 0) {
      const hasAllRoles = requiredRoles.every(role => roles.includes(role));
      const hasAnyRole = requiredRoles.some(role => roles.includes(role));
      const hasAccess = requireAll ? hasAllRoles : hasAnyRole;
      
      // Cache the client-side result
      const cacheKey = `${requiredRoles.join(',')}-${requireAll}`;
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheTimestamp < CACHE_TTL) {
        const cached = validationCache.get(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
      }
      
      // Update cache
      setValidationCache(prev => new Map(prev).set(cacheKey, hasAccess));
      setCacheTimestamp(now);
      
      return hasAccess;
    }
    
    // Fallback to server-side validation if no roles available
    try {
      const response = await fetch('/api/auth/roles/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: requiredRoles, requireAll }),
        credentials: 'include'
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      
      // Cache the server result
      const cacheKey = `${requiredRoles.join(',')}-${requireAll}`;
      setValidationCache(prev => new Map(prev).set(cacheKey, data.hasAccess));
      setCacheTimestamp(Date.now());
      
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
