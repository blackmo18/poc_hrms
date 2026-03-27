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
    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(sessionToken);
    } catch (error) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get user's organizationId from database (minimal call)
    const userService = getUserService();
    const user = await userService.getById(payload.userId);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get employee details if available
    let firstName = '';
    let lastName = '';
    let employeeId = '';
    if (user?.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { firstName: true, lastName: true }
      });
      if (employee) {
        firstName = employee.firstName;
        lastName = employee.lastName;
        employeeId = user.employeeId; // Include employeeId in response
      }
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        roles: payload.roleNames, // Use roles from JWT instead of DB call
        role: payload.roleNames[0] || 'EMPLOYEE', // Primary role for UI compatibility
        organizationId: user?.organizationId,
        firstName: firstName,
        lastName: lastName,
        employeeId: employeeId
      },
      // Note: Full roles array now comes from JWT for performance
      hasMultipleRoles: (payload.roleNames?.length || 0) > 1, // Indicate if user has multiple roles
      timestamp: new Date().toISOString() // Force refresh
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}