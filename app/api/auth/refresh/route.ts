import { NextRequest, NextResponse } from 'next/server';
import { JWTUtils } from '../../../../lib/auth/jwt';
import { findUserById, getUserRoles } from '../../../../lib/auth/auth-db';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = JWTUtils.verifyRefreshToken(refreshToken);

    // Check if user still exists and is active
    const user = await findUserById(payload.userId);
    if (!user || !user.enabled) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Get user roles
    const roles = await getUserRoles(user.id);
    const roleIds = roles.map(role => role.id);

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      organization_id: user.organization_id,
      roleIds,
      username: user.email
    };

    const accessToken = JWTUtils.generateAccessToken(tokenPayload);
    const newRefreshToken = JWTUtils.generateRefreshToken(tokenPayload);

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roles[0]?.name || 'EMPLOYEE',
        organizationId: user.organization_id
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}
