import { NextRequest, NextResponse } from 'next/server';
import { JWTUtils } from '../../../../lib/auth/jwt';
import { findUserById, getUserRoles } from '../../../../lib/auth/auth-db';

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = JWTUtils.extractTokenFromHeader(authHeader || undefined);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = JWTUtils.verifyAccessToken(token);
    
    // Find user by ID
    const user = await findUserById(payload.userId);
    if (!user || !user.enabled) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Get user roles
    const roles = await getUserRoles(user.id);

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: roles[0]?.name || 'EMPLOYEE',
        organizationId: user.organization_id
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}
