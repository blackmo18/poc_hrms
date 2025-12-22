import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: parseInt(session.user.id) },
      include: { role: true }
    });

    const isSuperAdmin = userRoles.some(userRole => userRole.role.name === 'SUPER_ADMIN');

    return NextResponse.json({ isSuperAdmin });
  } catch (error) {
    console.error('Error checking super admin role:', error);
    return NextResponse.json({ isSuperAdmin: false }, { status: 500 });
  }
}
