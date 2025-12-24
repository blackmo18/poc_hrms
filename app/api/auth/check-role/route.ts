import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserService, getRoleService } from '@/lib/service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 401 });
    }

    const userService = getUserService();
    const roleService = getRoleService();

    const user = await userService.getById(session.user.id);
    if (!user) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 401 });
    }

    const superAdminRole = await roleService.getByName('SUPER_ADMIN');
    if (!superAdminRole) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 200 });
    }

    return NextResponse.json({ isSuperAdmin: true });
  } catch (error) {
    console.error('Error checking super admin role:', error);
    return NextResponse.json({ isSuperAdmin: false }, { status: 500 });
  }
}
