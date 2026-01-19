import { NextRequest, NextResponse } from 'next/server';
import { roleController } from '@/lib/controllers/role.controller';
import { requiresPermissions } from '@/lib/auth/middleware';
import { CreateRoleSchema } from '@/lib/models/role';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['users.read'], async (authRequest) => {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get user info from auth request
    const user = authRequest.user!;

    // Check user role
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isAdmin = user.roles.includes('ADMIN');

    let roles;

    if (isSuperAdmin) {
      // Super Admin can see all roles across all organizations
      roles = await roleController.getAll(organizationId ? organizationId : undefined, { page, limit });
    } else if (isAdmin) {
      // Admin can see roles in their organization only
      roles = await roleController.getAll(user.organizationId, { page, limit });
    } else {
      // Regular employees might have limited access or no access
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(roles);
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['users.create'], async (authRequest) => {
    try {
      const body = await request.json();

      // Validate request data
      const validatedData = CreateRoleSchema.parse(body);

      // Get user info from auth request
      const user = authRequest.user!;

      // Check user role
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');

      // Super Admin can create roles for any organization
      // Admin can only create roles for their own organization
      if (!isSuperAdmin && !isAdmin) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (isAdmin && !isSuperAdmin && validatedData.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Cannot create roles for this organization' },
          { status: 403 }
        );
      }

      const role = await roleController.create(validatedData);
      return NextResponse.json(role, { status: 201 });
    } catch (error) {
      console.error('Error creating role:', error);
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      );
    }
  });
}
