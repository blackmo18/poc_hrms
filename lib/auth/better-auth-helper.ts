import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';
import { getUserService } from '@/lib/service/user.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
}

export async function authenticateRequest(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get session using Better-Auth
    const session = await auth.api.getSession({
      headers: request ? request.headers : await headers(),
    });

    if (!session?.user) {
      return null;
    }

    // Get full user data from database
    const userService = getUserService();
    const user = await userService.getById(session.user.id);
    
    if (!user) {
      return null;
    }

    // Get user roles and permissions
    const userRoles = await getUserRoles(user.id);
    const userPermissions = await getUserPermissions(user.id);

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: userRoles.map(role => role.name),
      permissions: userPermissions,
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

export async function withRoles(
  request: NextRequest,
  allowedRoles: string[],
  handler: (authRequest: NextRequest & { user: AuthenticatedUser }) => Promise<Response>
): Promise<Response> {
  const user = await authenticateRequest(request);
  
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!requireRole(user, allowedRoles)) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Add user to request object
  (request as any).user = user;
  return handler(request as any);
}

export async function withPermissions(
  request: NextRequest,
  requiredPermissions: string[],
  handler: (authRequest: NextRequest & { user: AuthenticatedUser }) => Promise<Response>
): Promise<Response> {
  const user = await authenticateRequest(request);
  
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const hasAllPermissions = requiredPermissions.every(permission => 
    requirePermission(user, permission)
  );

  if (!hasAllPermissions) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Add user to request object
  (request as any).user = user;
  return handler(request as any);
}

export async function withAdmin(
  request: NextRequest,
  handler: (authRequest: NextRequest & { user: AuthenticatedUser }) => Promise<Response>
): Promise<Response> {
  return withRoles(request, ['ADMIN', 'SUPER_ADMIN'], handler);
}
