import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Authenticate user using JWT utilities (which validates credentials)
    const authResult = await JWTUtils.authenticateUser(email, password);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Clean up old sessions for this user - delete all existing sessions
    await prisma.session.deleteMany({
      where: {
        userId: authResult.user.id
      }
    });

    // Get user roles and permissions for immediate availability
    const roles = await getUserRoles(authResult.user.id);
    const permissions = await getUserPermissions(authResult.user.id);

    // Create a session in the database for Better-Auth
    const sessionToken = JWTUtils.generateAccessToken({
      userId: authResult.user.id,
      email: authResult.user.email,
      organizationId: authResult.user.organizationId,
      roleIds: roles.map(role => role.id), // Use actual role IDs
      roleNames: roles.map(role => role.name), // Include role names
      username: authResult.user.email
    });

    // Store session in database
    await prisma.session.create({
      data: {
        id: sessionToken,
        sessionToken: sessionToken,
        userId: authResult.user.id,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    }).catch(() => {
      // Session might already exist, that's okay
    });

    // Return user data with session managed by Better-Auth cookies
    const result = NextResponse.json({
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        username: authResult.user.email, // Use email as username
        roles: roles.map(role => role.name),
        organizationId: authResult.user.organizationId
      },
      // Note: Minimal data approach - removed firstName, lastName, employeeId for security
      // These can be fetched on-demand via /api/auth/profile when needed
      hasMultipleRoles: roles.length > 1
    });

    // Set session cookie
    result.cookies.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return result;

  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}