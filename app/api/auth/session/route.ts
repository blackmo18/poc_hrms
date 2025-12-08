import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';

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

    return NextResponse.json({ 
      user: {
        id: payload.userId.toString(),
        email: payload.email,
        name: payload.username,
        role: roles[0]?.name || 'EMPLOYEE',
        roles: roles.map(role => role.name),
        permissions
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}