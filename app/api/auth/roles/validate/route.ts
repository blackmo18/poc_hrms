import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles } from '@/lib/auth/auth-db';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the session token (JWT)
    const payload = JWTUtils.verifyAccessToken(sessionToken);

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { roles: requiredRoles, requireAll = false } = body;

    if (!Array.isArray(requiredRoles)) {
      return NextResponse.json({ error: 'Invalid roles array' }, { status: 400 });
    }

    // Get user roles from database (supports multiple roles)
    const userRoles = await getUserRoles(payload.userId);
    const userRoleNames = userRoles.map(role => role.name);

    // Debug logging - remove in production
    console.log('Role validation debug:', {
      userId: payload.userId,
      requiredRoles,
      requireAll,
      userRoles: userRoleNames,
      userRoleCount: userRoles.length
    });

    // Check role access with multi-role support
    const hasAllRoles = requiredRoles.every(role => userRoleNames.includes(role));
    const hasAnyRole = requiredRoles.some(role => userRoleNames.includes(role));
    
    const details = requiredRoles.reduce((acc, role) => {
      acc[role] = userRoleNames.includes(role);
      return acc;
    }, {} as Record<string, boolean>);

    // Return appropriate result based on requireAll flag
    const hasAccess = requireAll ? hasAllRoles : hasAnyRole;

    return NextResponse.json({
      hasAccess,
      hasAllRoles,
      hasAnyRole,
      userRoles: userRoleNames, // Return all user roles for context
      requiredRoles,
      requireAll,
      details
    });

  } catch (error) {
    console.error('Role validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
