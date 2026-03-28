import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token' }, { status: 401 });
    }

    // Verify the session token (JWT)
    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(sessionToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Fetch complete user profile with employee details
    const userRecord = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        employeeId: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            hireDate: true,
            employmentStatus: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return complete user profile
    return NextResponse.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        username: payload.username || userRecord.email,
        organizationId: userRecord.organization?.id,
        organizationName: userRecord.organization?.name,
        employeeId: userRecord.employeeId,
        firstName: userRecord.employee?.firstName || '',
        lastName: userRecord.employee?.lastName || '',
        hireDate: userRecord.employee?.hireDate,
        employmentStatus: userRecord.employee?.employmentStatus,
        roles: payload.roleNames || []
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
