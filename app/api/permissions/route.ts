import { NextRequest, NextResponse } from 'next/server';
import { getPermissionService } from '@/lib/service';
import { requiresPermissions } from '@/lib/auth/middleware';

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

    // For now, only super admin can view permissions
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only super administrators can view permissions.' },
        { status: 403 }
      );
    }

    const skip = (page - 1) * limit;

    // Get paginated permissions using service
    const result = await getPermissionService().getAllWithPagination(organizationId, { page, limit });

    // Transform data to match frontend expectations
    const transformedPermissions = result.data.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      organizationId: permission.organizationId,
      rolePermissions: permission.rolePermissions,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: transformedPermissions,
      pagination: result.pagination
    });
  }).catch((error) => {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['users.create'], async (authRequest) => {
    try {
      const body = await request.json();
      const { name, description, organizationId } = body;

      // Validate required fields
      if (!name) {
        return NextResponse.json(
          { error: 'Permission name is required' },
          { status: 400 }
        );
      }

      // Check if permission name already exists
      const existingPermission = await getPermissionService().getByName(name);

      if (existingPermission) {
        return NextResponse.json(
          { error: 'Permission name already exists' },
          { status: 400 }
        );
      }

      // Create permission using service
      const permission = await  (getPermissionService().create as any)({
        name,
        description,
        organizationId: organizationId || null,
      });

      // Fetch the created permission with relations using service
      const fullPermission = await getPermissionService().getByIdWithRelations(permission.id);

      if (!fullPermission) {
        throw new Error('Failed to retrieve created permission');
      }

      // Transform response - new permissions won't have rolePermissions yet
      const transformedPermission = {
        id: fullPermission.id,
        name: fullPermission.name,
        description: fullPermission.description,
        organizationId: fullPermission.organizationId,
        rolePermissions: fullPermission.rolePermissions || [],
        createdAt: fullPermission.createdAt.toISOString(),
        updatedAt: fullPermission.updatedAt.toISOString(),
      };

      return NextResponse.json({
        data: transformedPermission,
        success: true,
      });
    } catch (error) {
      console.error('Error creating permission:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
