import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';
import { getUserService } from '@/lib/service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ user: null });
    }

    // Verify the JWT token
    const payload = JWTUtils.verifyAccessToken(accessToken);

    // Get user roles and permissions
    const roles = await getUserRoles(payload.userId);
    const permissions = await getUserPermissions(payload.userId);

    // Get user's organization_id from the database
    const userService = getUserService();
    const user = await userService.getById(payload.userId.toString());

    return NextResponse.json({
      user: {
        id: payload.userId.toString(),
        email: payload.email,
        username: payload.username,
        role: roles[0]?.name || 'EMPLOYEE',
        roles: roles.map(role => role.name),
        permissions,
        organization_id: user?.organization_id
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}