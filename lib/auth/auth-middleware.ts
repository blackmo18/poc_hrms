import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export async function authenticateRequest(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return null;
    }

    // Verify the JWT token
    const payload = JWTUtils.verifyAccessToken(accessToken);

    // Get user roles and permissions
    const roles = await getUserRoles(payload.userId);
    const permissions = await getUserPermissions(payload.userId);

    return {
      id: payload.userId.toString(),
      email: payload.email,
      username: payload.username,
      roles: roles.map(role => role.name),
      permissions: permissions
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireRole(user: AuthenticatedUser | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.some(role => user.roles.includes(role));
}

export function requirePermission(user: AuthenticatedUser | null, requiredPermission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(requiredPermission);
}
