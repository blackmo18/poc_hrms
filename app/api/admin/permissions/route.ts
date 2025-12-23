import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { permissionController } from '@/lib/controllers/permission.controller';

export async function GET(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const permissionId = searchParams.get('id');

      if (permissionId) {
        // Get specific permission
        const permission = await permissionController.getById(permissionId);
        if (!permission) {
          return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
        }
        return NextResponse.json(permission);
      } else {
        // Get all permissions (system + organization)
        const organization_id = authRequest.user!.organizationId;
        const [systemPermissions, orgPermissions] = await Promise.all([
          permissionController.getSystemPermissions(),
          permissionController.getOrganizationPermissions(organization_id)
        ]);

        return NextResponse.json({
          systemPermissions,
          organizationPermissions: orgPermissions
        });
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const { name, description } = body;

      if (!name) {
        return NextResponse.json({ error: 'Permission name is required' }, { status: 400 });
      }

      // Check if permission already exists (system-wide or in organization)
      const [systemPermissions, orgPermissions] = await Promise.all([
        permissionController.getSystemPermissions(),
        permissionController.getOrganizationPermissions(authRequest.user!.organizationId)
      ]);

      const allPermissions = [...systemPermissions, ...orgPermissions];
      const permissionExists = allPermissions.some(p => p.name.toLowerCase() === name.toLowerCase());

      if (permissionExists) {
        return NextResponse.json(
          { error: 'Permission with this name already exists' },
          { status: 409 }
        );
      }

      // Create permission (organization-specific)
      const permission = await permissionController.create({
        name,
        description,
        organization_id: authRequest.user!.organizationId
      });

      return NextResponse.json({
        message: 'Permission created successfully',
        permission
      }, { status: 201 });

    } catch (error) {
      console.error('Error creating permission:', error);
      return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const { id, name, description } = body;

      if (!id) {
        return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
      }

      // Check if permission exists and belongs to the organization
      const permission = await permissionController.getById(id);
      if (!permission || permission.organization_id !== authRequest.user!.organizationId) {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }

      // Check if new name conflicts with existing permissions
      if (name && name !== permission.name) {
        const [systemPermissions, orgPermissions] = await Promise.all([
          permissionController.getSystemPermissions(),
          permissionController.getOrganizationPermissions(authRequest.user!.organizationId)
        ]);

        const allPermissions = [...systemPermissions, ...orgPermissions];
        const nameExists = allPermissions.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase());

        if (nameExists) {
          return NextResponse.json(
            { error: 'Permission with this name already exists' },
            { status: 409 }
          );
        }
      }

      // Update permission
      const updatedPermission = await permissionController.update(id, {
        name,
        description
      });

      return NextResponse.json({
        message: 'Permission updated successfully',
        permission: updatedPermission
      });

    } catch (error) {
      console.error('Error updating permission:', error);
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const permissionId = searchParams.get('id');

      if (!permissionId) {
        return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
      }

      // Check if permission exists and belongs to the organization
      const permission = await permissionController.getById(permissionId);
      if (!permission || permission.organization_id !== authRequest.user!.organizationId) {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }

      // Prevent deletion of system permissions
      if (!permission.organization_id) {
        return NextResponse.json({
          error: 'Cannot delete system permissions'
        }, { status: 403 });
      }

      await permissionController.delete(permissionId);

      return NextResponse.json({ message: 'Permission deleted successfully' });

    } catch (error) {
      console.error('Error deleting permission:', error);
      return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
    }
  });
}
