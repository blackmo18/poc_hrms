import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/lib/controllers/user.controller';
import { requiresPermissions } from '@/lib/auth/middleware';
import { CreateUserSchema } from '@/lib/models/user';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['users.read'], async (authRequest) => {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

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

    let result;

    if (isSuperAdmin) {
      // Super Admin can see all users across all organizations
      result = await userController.getAll(
        organizationId ? organizationId : undefined,
        { page, limit }
      );
    } else if (isAdmin) {
      // Admin can see users in their organization only
      result = await userController.getAll(user.organization_id, { page, limit });
    } else {
      // Regular employees might have limited access or no access
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(result);
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['users.create'], async (authRequest) => {
    try {
      const body = await request.json();

      // Validate request data
      const validatedData = CreateUserSchema.parse(body);

      // Get user info from auth request
      const user = authRequest.user!;

      // Check user role
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');

      // Super Admin can create users for any organization
      // Admin can only create users for their own organization
      if (!isSuperAdmin && !isAdmin) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (isAdmin && !isSuperAdmin && validatedData.organization_id !== user.organization_id) {
        return NextResponse.json(
          { error: 'Cannot create users for this organization' },
          { status: 403 }
        );
      }

      const createdUser = await userController.create(validatedData);
      return NextResponse.json(createdUser, { status: 201 });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  });
}
