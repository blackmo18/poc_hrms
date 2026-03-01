import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from './session-validator';
import { permissionController } from '../controllers';
import { getPermissionsByRoleIds, getUserRoles } from './auth-db';
import { getUserService } from '../service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    roles: string[];
  };
}

/* ===================================================== */
/* AUTHENTICATION MIDDLEWARE                            */
/* ===================================================== */

/**
 * Authentication middleware for API routes
 */
export async function authMiddleware(request: NextRequest): Promise<any | NextResponse> {
  try {
    // Validate session from cookies
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user from database to ensure they still exist and are active
    const userService = getUserService();
    const user = await userService.getById(session.userId);

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Get user roles
    const userRoles = await getUserRoles(session.userId);
    const roles = userRoles.map(role => role.name);

    // Return user object
    return {
      id: session.userId,
      email: session.email,
      organizationId: user.organizationId,
      roles: roles
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Invalid authentication' },
      { status: 401 }
    );
  }
}

/**
 * Organization access middleware - ensures user can only access their own organization
 */
export async function organizationMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const authRequest = request as AuthenticatedRequest;
  const userOrganization = authRequest.user?.organizationId;
  const requestedOrganization = request.nextUrl.searchParams.get('organizationId') || 
                               request.headers.get('x-organization-id');

  if (requestedOrganization && userOrganization !== requestedOrganization) {
    return NextResponse.json(
      { error: 'Access to this organization is not allowed' },
      { status: 403 }
    );
  }

  return null; // Continue to the actual handler
}

/* ===================================================== */
/* AUTHORIZATION MIDDLEWARE                             */
/* ===================================================== */

/**
 * Role-based access control middleware
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authRequest = request as AuthenticatedRequest;
    const userRoles = authRequest.user?.roles || [];
    
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Continue to the actual handler
  };
}

/* ===================================================== */
/* HELPER FUNCTIONS                                      */
/* ===================================================== */

/**
 * Helper function to get user permissions from database
 */
export async function getUserPermissionsForUser(userId: string): Promise<string[]> {
  const userRoles = await getUserRoles(userId);
  const roleIds = userRoles.map(role => role.id);
  return await getPermissionsByRoleIds(roleIds);
}

/* ===================================================== */
/* AUTHENTICATION & AUTHORIZATION WRAPPERS              */
/* ===================================================== */

/**
 * Wrapper function that handles authentication and role-based authorization
 */
export const requiresRoles = async (
  request: NextRequest,
  allowedRoles: string[],
  handler: (authRequest: AuthenticatedRequest) => Promise<NextResponse>
) => {
  try {
    // Authentication
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    // Authorization - Check role
    const hasRole = allowedRoles.some(role => user.roles.includes(role));
    if (!hasRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Execute handler
    const authRequest = request as AuthenticatedRequest;
    authRequest.user = user;
    return await handler(authRequest);
    
  } catch (error) {
    console.error('Role check error:', error);
    return NextResponse.json(
      { error: 'Authentication or authorization failed' },
      { status: 500 }
    );
  }
};

/**
 * Wrapper function that handles authentication and permission-based authorization
 */
export const requiresPermissions = async (
  request: NextRequest,
  requiredPermissions: string[],
  handler: (authRequest: AuthenticatedRequest) => Promise<NextResponse>
) => {
  try {
    // Authentication
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    // Authorization - Check permissions
    const userPermissions = await getUserPermissionsForUser(user.id);
    const hasRequiredPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Execute handler
    const authRequest = request as AuthenticatedRequest;
    authRequest.user = user;
    return await handler(authRequest);
    
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Authentication or authorization failed' },
      { status: 500 }
    );
  }
};

/**
 * Wrapper function specifically for admin operations
 */
export const requiresAdmin = async (
  request: NextRequest,
  handler: (authRequest: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return requiresRoles(request, ['ADMIN', 'SUPER_ADMIN'], handler);
};

/* ===================================================== */
/* EXPORTS                                              */
/* ===================================================== */

export default {
  authMiddleware,
  rbacMiddleware,
  organizationMiddleware,
  requiresRoles,
  requiresPermissions,
  requiresAdmin
};
