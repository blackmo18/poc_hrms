import { NextRequest, NextResponse } from 'next/server';
import { JWTUtils } from './jwt';
import { prisma } from '../db';
import { permissionController } from '../controllers';
import { findUserById, getPermissionsByRoleIds } from './auth-db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    organizationId: number;
    role: string;
  };
}

/* ===================================================== */
/* AUTHENTICATION MIDDLEWARE                            */
/* ===================================================== */

/**
 * Authentication middleware for API routes
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Extract token from Authorization header
    const token = JWTUtils.extractTokenFromHeader(request.headers.get('authorization') || undefined);
    
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

    // Add user info to request headers for downstream handlers
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id.toString());
    response.headers.set('x-user-email', user.email);
    response.headers.set('x-user-organization', user.organization_id.toString());
    response.headers.set('x-user-role', user.userRoles[0]?.role?.name || 'EMPLOYEE');

    return null; // Continue to the actual handler
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
  const userOrganization = request.headers.get('x-user-organization');
  const requestedOrganization = request.nextUrl.searchParams.get('organization_id') || 
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
    const userRole = request.headers.get('x-user-role');
    
    if (!userRole || !allowedRoles.includes(userRole)) {
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
 * Helper function to get authenticated user from request
 */
export function getAuthenticatedUser(request: NextRequest) {
  return {
    id: parseInt(request.headers.get('x-user-id') || '0'),
    email: request.headers.get('x-user-email') || '',
    organizationId: parseInt(request.headers.get('x-user-organization') || '0'),
    role: request.headers.get('x-user-role') || 'EMPLOYEE'
  };
}

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
export const requireRoles = async (
  request: NextRequest,
  allowedRoles: string[],
  handler: (authRequest: AuthenticatedRequest) => Promise<NextResponse>
) => {
  try {
    // Authentication
    const authResult = await authMiddleware(request);
    if (authResult) return authResult;

    // Get user
    const user = getAuthenticatedUser(request);
    if (!user || user.id === 0) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorization - Check role
    const hasRole = allowedRoles.includes(user.role);
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
export const requirePermission = async (
  request: NextRequest,
  requiredPermissions: string[],
  handler: (authRequest: AuthenticatedRequest) => Promise<NextResponse>
) => {
  try {
    // Authentication
    const authResult = await authMiddleware(request);
    if (authResult) return authResult;

    // Get user
    const user = getAuthenticatedUser(request);
    if (!user || user.id === 0) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get role IDs from JWT
    const token = JWTUtils.extractTokenFromHeader(request.headers.get('authorization') || undefined);
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

/* ===================================================== */
/* EXPORTS                                              */
/* ===================================================== */

export default {
  authMiddleware,
  rbacMiddleware,
  organizationMiddleware,
  getAuthenticatedUser,
  requireRoles,
  requirePermission
};
