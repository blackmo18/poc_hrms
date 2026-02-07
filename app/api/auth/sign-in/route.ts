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

    // Create a session in the database for Better-Auth
    const sessionToken = JWTUtils.generateAccessToken({
      userId: authResult.user.id,
      email: authResult.user.email,
      organizationId: authResult.user.organizationId,
      roleIds: [],
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

    // Get user roles and permissions for immediate availability
    const roles = await getUserRoles(authResult.user.id);
    const permissions = await getUserPermissions(authResult.user.id);

    // Return user data with session managed by Better-Auth cookies
    const result = NextResponse.json({
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        firstName: authResult.user.firstName,
        lastName: authResult.user.lastName,
        roles: roles.map(role => role.name),
        permissions: permissions,
        organizationId: authResult.user.organizationId
      }
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