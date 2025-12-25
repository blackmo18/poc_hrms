import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserContext, hasRole } from '@/lib/auth/context';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionId = params.id;

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        organization: true,
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Transform data to match frontend expectations
    const transformedPermission = {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      organization: permission.organization,
      rolePermissions: permission.rolePermissions,
      created_at: permission.created_at.toISOString(),
      updated_at: permission.updated_at.toISOString(),
    };

    return NextResponse.json({
      data: transformedPermission,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can update permissions
    if (!hasRole(userContext, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const permissionId = params.id;
    const body = await request.json();
    const { name, description, organization_id } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission name already exists (excluding current permission)
    const existingPermission = await prisma.permission.findFirst({
      where: {
        name,
        id: { not: permissionId },
      },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission name already exists' },
        { status: 400 }
      );
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name,
        description,
        organization_id: organization_id || null, // null for global permissions
        updated_by: userContext.id,
      },
      include: {
        organization: true,
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform response
    const transformedPermission = {
      id: updatedPermission.id,
      name: updatedPermission.name,
      description: updatedPermission.description,
      organization: updatedPermission.organization,
      rolePermissions: updatedPermission.rolePermissions,
      created_at: updatedPermission.created_at.toISOString(),
      updated_at: updatedPermission.updated_at.toISOString(),
    };

    return NextResponse.json({
      data: transformedPermission,
      success: true,
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can delete permissions
    if (!hasRole(userContext, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const permissionId = params.id;

    // Check if permission exists and is assigned to any roles
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Prevent deletion if permission is assigned to roles
    if (permission.rolePermissions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete permission that is assigned to roles' },
        { status: 400 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({
      message: 'Permission deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
