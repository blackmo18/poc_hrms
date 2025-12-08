import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { roleController } from '@/lib/controllers/role.controller';

export async function GET(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const roleId = searchParams.get('id');

      if (roleId) {
        // Get specific role
        const role = await roleController.getById(Number(roleId));
        if (!role) {
          return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }
        return NextResponse.json(role);
      } else {
        // Get all roles for the organization
        const organizationId = authRequest.user!.organizationId;
        const roles = await roleController.getAll(organizationId);
        return NextResponse.json(roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const { name, description, permissionIds } = body;

      if (!name) {
        return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
      }

      // Check if role already exists in the organization
      const existingRole = await roleController.getAll(authRequest.user!.organizationId);
      const roleExists = existingRole.some(role => role.name.toLowerCase() === name.toLowerCase());

      if (roleExists) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 409 }
        );
      }

      // Create role
      const role = await roleController.create({
        name,
        description,
        organization_id: authRequest.user!.organizationId
      });

      // Assign permissions if provided
      if (permissionIds && Array.isArray(permissionIds)) {
        for (const permissionId of permissionIds) {
          await roleController.assignPermission(role.id, Number(permissionId));
        }

        // Get updated role with permissions
        const updatedRole = await roleController.getById(role.id);
        return NextResponse.json({
          message: 'Role created successfully',
          role: updatedRole
        }, { status: 201 });
      }

      return NextResponse.json({
        message: 'Role created successfully',
        role
      }, { status: 201 });

    } catch (error) {
      console.error('Error creating role:', error);
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const { id, name, description, permissionIds } = body;

      if (!id) {
        return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
      }

      // Check if role exists and belongs to the organization
      const existingRole = await roleController.getById(Number(id));
      if (!existingRole || existingRole.organization_id !== authRequest.user!.organizationId) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }

      // Update role
      const updatedRole = await roleController.update(Number(id), {
        name,
        description
      });

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Remove all existing permissions
        const currentPermissions = await roleController.getRolePermissions(Number(id));
        for (const permission of currentPermissions) {
          await roleController.removePermission(Number(id), permission.id);
        }

        // Add new permissions
        if (Array.isArray(permissionIds)) {
          for (const permissionId of permissionIds) {
            await roleController.assignPermission(Number(id), Number(permissionId));
          }
        }
      }

      // Get final role with updated permissions
      const finalRole = await roleController.getById(Number(id));

      return NextResponse.json({
        message: 'Role updated successfully',
        role: finalRole
      });

    } catch (error) {
      console.error('Error updating role:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const roleId = searchParams.get('id');

      if (!roleId) {
        return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
      }

      // Check if role exists and belongs to the organization
      const role = await roleController.getById(Number(roleId));
      if (!role || role.organization_id !== authRequest.user!.organizationId) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }

      // Prevent deletion of built-in roles (ADMIN, HR_MANAGER, EMPLOYEE)
      const protectedRoles = ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'];
      if (protectedRoles.includes(role.name)) {
        return NextResponse.json({
          error: 'Cannot delete built-in roles'
        }, { status: 403 });
      }

      await roleController.delete(Number(roleId));

      return NextResponse.json({ message: 'Role deleted successfully' });

    } catch (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
  });
}
