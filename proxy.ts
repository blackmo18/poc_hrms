import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { getUserPermissions } from '@/lib/auth/auth-db';
import { isAuthEnabled, isExternalAuthEnabled } from './lib/config';
import { AuthenticatedUser } from '@/models/auth';
import {
    verifyExternalToken,
    extractPermissionsFromToken,
    extractUsernameFromToken,
} from './external-auth';

export interface AuthenticatedRequest extends NextRequest {
    user?: AuthenticatedUser;
}

type AuthResult = {
    authenticated: boolean;
    user?: AuthenticatedUser;
    error?: string;
};

/* ------------------------------------------------------------ */
/* Token Extraction                                              */
/* ------------------------------------------------------------ */
function extractToken(req: NextRequest): string | null {
    const header = req.headers.get('authorization');
    if (header?.startsWith('Bearer ')) {
        return header.slice(7);
    }
    return req.cookies.get('auth_token')?.value ?? null;
}

/* ------------------------------------------------------------ */
/* Error Helpers                                                 */
/* ------------------------------------------------------------ */
function unauthorized(message: string) {
    return NextResponse.json({ error: 'Unauthorized', message }, { status: 401 });
}

function forbidden(message: string) {
    return NextResponse.json({ error: 'Forbidden', message }, { status: 403 });
}

/* ------------------------------------------------------------ */
/* Main Authentication Logic                                     */
/* ------------------------------------------------------------ */
export async function authenticate(req: NextRequest): Promise<AuthResult> {
    const token = extractToken(req);
    if (!token) {
        console.log('proxy - No token provided');
        return { authenticated: false, error: 'No token provided' };
    }

    const authenticationEnabled = isExternalAuthEnabled();
    console.log('External authentication enabled:', authenticationEnabled);
    return authenticationEnabled
        ? authenticateExternal(token)
        : authenticateDatabase(token);
}

/* ------------------------------------------------------------ */
/* External Auth                                                 */
/* ------------------------------------------------------------ */
async function authenticateExternal(token: string): Promise<AuthResult> {
    const decoded = verifyExternalToken(token);
    if (!decoded) {
        return { authenticated: false, error: 'Invalid or expired token' };
    }

    return {
        authenticated: true,
        user: {
            id: BigInt(0),
            username: extractUsernameFromToken(token) ?? 'external-user',
            roleIds: [],
            permissions: extractPermissionsFromToken(token),
        },
    };
}

/* ------------------------------------------------------------ */
/* Database Auth                                                 */
/* ------------------------------------------------------------ */
async function authenticateDatabase(token: string): Promise<AuthResult> {
    const payload = await verifyToken(token);
    if (!payload) return { authenticated: false, error: 'Invalid token' };

    const permissions = await getUserPermissions(payload.userId);

    return {
        authenticated: true,
        user: {
            id: payload.userId,
            username: payload.username,
            roleIds: payload.roleIds,
            permissions,
        },
    };
}

/* ------------------------------------------------------------ */
/* Base Middleware: requireAuth                                  */
/* ------------------------------------------------------------ */
async function requireAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse | Response>
) {
  const result = await authenticate(req);
  
  if (!result.authenticated) {
    // For API routes, return 401
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return unauthorized(result.error || 'Authentication required');
    }
    // For pages, redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const authReq = req as AuthenticatedRequest;
  authReq.user = result.user;

  return handler(authReq);
}

/* ------------------------------------------------------------ */
/* Permission Helpers                                            */
/* ------------------------------------------------------------ */
const hasPermission = (perms: string[], req: string) => perms.includes(req);
const hasAnyPermission = (perms: string[], req: string[]) =>
    req.some((p) => perms.includes(p));
const hasAllPermissions = (perms: string[], req: string[]) =>
    req.every((p) => perms.includes(p));

/* ------------------------------------------------------------ */
/* requirePermission Middleware                                   */
/* ------------------------------------------------------------ */
export async function requirePermission(
    req: NextRequest,
    permission: string,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse | Response>
) {
    return requireAuth(req, async (authReq) => {
        const user = authReq.user;
        if (!user) return unauthorized('Unauthorized');

        if (!hasPermission(user.permissions, permission)) {
            return forbidden(`Missing required permission: ${permission}`);
        }

        return handler(authReq);
    });
}

/* ------------------------------------------------------------ */
/* requireAnyPermission Middleware                               */
/* ------------------------------------------------------------ */
export async function requireAnyPermission(
    req: NextRequest,
    required: string[],
    handler: (req: AuthenticatedRequest) => Promise<NextResponse | Response>
) {
    return requireAuth(req, async (authReq) => {
        const user = authReq.user;
        if (!user) return unauthorized('Unauthorized');

        if (!hasAnyPermission(user.permissions, required)) {
            return forbidden(`Missing required permissions: ${required.join(', ')}`);
        }

        return handler(authReq);
    });
}

/* ------------------------------------------------------------ */
/* Main Proxy Function                                            */
/* ------------------------------------------------------------ */

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/sign-in',
  '/api/auth/session',
  '/api/auth/validate',
  '/_next/static',
  '/_next/image',
  '/favicon.ico'
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip authentication for public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // For page routes (not API), allow through without authentication
  // The frontend will handle authentication state and redirects
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For API routes, require authentication
  return requireAuth(req, async (authReq) => {
    return NextResponse.json({ 
      authenticated: true, 
      user: authReq.user 
    });
  });
}