import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserContext, hasRole } from '@/lib/auth/context';

export async function GET(request: NextRequest) {
  try {
    const userContext = getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.permission.findMany({
      include: {
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
        organization: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform data to match frontend expectations
    const transformedPermissions = permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      organization: permission.organization,
      rolePermissions: permission.rolePermissions,
      created_at: permission.created_at.toISOString(),
      updated_at: permission.updated_at.toISOString(),
    }));

    return NextResponse.json({
      data: transformedPermissions,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can create permissions
    if (!hasRole(userContext, 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, organization_id } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission name already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission name already exists' },
        { status: 400 }
      );
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        organization_id: organization_id || null, // null for global permissions
        created_by: userContext.id,
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
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
