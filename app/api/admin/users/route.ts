import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { createUser, assignRoleToUser, updateUser, listUsers, findUserById } from '@/lib/auth/auth-db';
import { getUserService, getUserRoleService } from '@/lib/service';

export async function GET(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get('id');

      if (userId) {
        // Get specific user
        const userService = getUserService();
        const user = await userService.getById(userId);
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
      } else {
        // Get all users for the organization
        const organizationId = authRequest.user!.organizationId;
        const users = await listUsers(organizationId);
        return NextResponse.json(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const { email, password, name, roleId } = body;

      if (!email || !password || !name) {
        return NextResponse.json(
          { error: 'Email, password, and name are required' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const userService = getUserService();
      const existingUser = await userService.getByEmail(email);

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Create user
      const organizationId = authRequest.user!.organizationId;
      const userId = await createUser(email, password, name, organizationId, authRequest.user!.email);

      // Assign role if provided
      if (roleId) {
        await assignRoleToUser(userId, roleId);
      }

      // Get the created user
      const user = await findUserById(userId);

      return NextResponse.json({
        message: 'User created successfully',
        user
      }, { status: 201 });

    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const { id, email, name, status, roleId } = body;

      if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      // Check if user exists and belongs to the same organization
      const userService = getUserService();
      const user = await userService.getById(id);

      if (!user || user.organization_id !== authRequest.user!.organizationId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update user
      const updates: any = {};
      if (status !== undefined) updates.status = status;

      await updateUser(id, updates);

      // Update email and name if provided
      if (email || name) {
        await userService.update(id, {
          ...(email && { email }),
          ...(name && { name })
        });
      }

      // Update role if provided
      if (roleId !== undefined) {
        const userRoleService = getUserRoleService();
        // Get current roles first
        const currentUserRoles = await userRoleService.getByUserId(id);
        const currentRoleId = currentUserRoles[0]?.role_id;
        
        // Remove existing roles if different
        if (currentRoleId && currentRoleId !== roleId) {
          await userRoleService.deleteByUserAndRole(id, currentRoleId);
        }

        // Assign new role if provided
        if (roleId) {
          await assignRoleToUser(id, roleId);
        }
      }

      // Get updated user
      const updatedUser = await findUserById(id);

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get('id');

      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      // Check if user exists and belongs to the same organization
      const userService = getUserService();
      const user = await userService.getById(userId);

      if (!user || user.organization_id !== authRequest.user!.organizationId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Soft delete by setting status to INACTIVE
      await updateUser(userId, { status: 'INACTIVE' });

      return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
  });
}
