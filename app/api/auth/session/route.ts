import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';
import { prisma } from '@/lib/db';

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

    // Get user's public_id and organization public_id from the database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: {
          select: { public_id: true }
        }
      }
    });

    return NextResponse.json({ 
      user: {
        id: user?.public_id,
        email: payload.email,
        username: payload.username,
        role: roles[0]?.name || 'EMPLOYEE',
        roles: roles.map(role => role.name),
        permissions,
        organization_id: user?.organization?.public_id
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}