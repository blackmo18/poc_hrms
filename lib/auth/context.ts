import { NextRequest } from 'next/server';

export interface UserContext {
  id: string;
  roles: string[];
  permissions: string[];
}

/**
 * Extract user context from request headers set by the proxy
 */
export function getUserContext(req: NextRequest): UserContext | null {
  const userId = req.headers.get('x-user-id');
  const rolesHeader = req.headers.get('x-user-roles');
  const permissionsHeader = req.headers.get('x-user-permissions');

  if (!userId || !rolesHeader || !permissionsHeader) {
    return null;
  }

  try {
    const roles = JSON.parse(rolesHeader);
    const permissions = JSON.parse(permissionsHeader);

    return {
      id: userId,
      roles,
      permissions
    };
  } catch (error) {
    console.error('Failed to parse user context:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userContext: UserContext | null, permission: string): boolean {
  if (!userContext) return false;
  return userContext.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userContext: UserContext | null, permissions: string[]): boolean {
  if (!userContext) return false;
  return permissions.some(permission => userContext.permissions.includes(permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(userContext: UserContext | null, permissions: string[]): boolean {
  if (!userContext) return false;
  return permissions.every(permission => userContext.permissions.includes(permission));
}

/**
 * Check if user has specific role
 */
export function hasRole(userContext: UserContext | null, role: string): boolean {
  if (!userContext) return false;
  return userContext.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userContext: UserContext | null, roles: string[]): boolean {
  if (!userContext) return false;
  return roles.some(role => userContext.roles.includes(role));
}
