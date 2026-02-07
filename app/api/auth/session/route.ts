import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';
import { getUserService } from '@/lib/service';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify the session token (JWT)
    const payload = JWTUtils.verifyAccessToken(sessionToken);

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get user roles and permissions
    const roles = await getUserRoles(payload.userId);
    const permissions = await getUserPermissions(payload.userId);

    // Get user's organizationId from the database
    const userService = getUserService();
    const user = await userService.getById(payload.userId);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get employee details if available
    let firstName = '';
    let lastName = '';
    if (user?.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { firstName: true, lastName: true }
      });
      if (employee) {
        firstName = employee.firstName;
        lastName = employee.lastName;
      }
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        role: roles[0]?.name || 'EMPLOYEE',
        roles: roles.map(role => role.name),
        permissions,
        organizationId: user?.organizationId,
        firstName: firstName,
        lastName: lastName
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}