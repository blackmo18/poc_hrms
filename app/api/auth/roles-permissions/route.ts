import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { getUserRoles } from '@/lib/auth/auth-db';
import { getUserPermissions } from '@/lib/auth/auth-db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    // Fetch fresh roles and permissions from database
    const roles = await getUserRoles(user.id);
    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({
      roles: roles.map(role => role.name),
      permissions: permissions
    });
  } catch (error) {
    console.error('Error fetching roles and permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles and permissions' },
      { status: 500 }
    );
  }
}
