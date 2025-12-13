import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JWTUtils } from './jwt';
import { prisma } from '../db';
import { permissionController } from '../controllers';
import { findUserById, getPermissionsByRoleIds } from './auth-db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    organizationId: number;
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
    // First try to extract token from Authorization header
    let token = JWTUtils.extractTokenFromHeader(request.headers.get('authorization') || undefined);

    // If no header token, try to get token from cookies (for cookie-based auth)
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get('access_token')?.value;
      } catch (error) {
        // cookies() might not be available in all contexts
        console.warn('Could not access cookies for authentication');
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (JWTUtils.isTokenExpired(token)) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTUtils.verifyAccessToken(token);

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Return user object
    console.log('Authenticated user: ', user);
    return {
      id: user.id,
      email: user.email,
      organizationId: user.organization_id,
      roles: user.userRoles.map(ur => ur.role?.name).filter(Boolean) as string[]
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
  const requestedOrganization = request.nextUrl.searchParams.get('organization_id') || 
                               request.headers.get('x-organization-id');

  if (requestedOrganization && userOrganization !== parseInt(requestedOrganization)) {
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
 * Helper function to check if user has required permissions
 */
async function getUserPermissions(roleIds: number[]): Promise<string[]> {
  const userPermissions: string[] = [];
  for (const roleId of roleIds) {
    const rolePermissions = await permissionController.getPermissionsByRoleId(roleId);
    userPermissions.push(...rolePermissions);
  }
  return [...new Set(userPermissions)]; // Remove duplicates
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

    // Get role IDs - since we have user, but to get permissions, we need role IDs from JWT
    // Get token again to get roleIds
    let token = JWTUtils.extractTokenFromHeader(request.headers.get('authorization') || undefined);

    // If no header token, try to get token from cookies
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get('access_token')?.value;
      } catch (error) {
        console.warn('Could not access cookies for authentication');
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = JWTUtils.decodeToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Authorization - Check permissions
    const userPermissions = await getPermissionsByRoleIds(decoded.roleIds);
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
export const requireAdmin = async (
  request: NextRequest,
  handler: (authRequest: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return requiresRoles(request, ['ADMIN'], handler);
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
  requireAdmin
};
