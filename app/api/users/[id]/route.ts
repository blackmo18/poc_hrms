import { NextRequest, NextResponse } from 'next/server';
import { requiresRoles, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getUserService } from '@/lib/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requiresRoles(request, ['SUPER_ADMIN'], async (authRequest: AuthenticatedRequest) => {
    try {
      const userId = params.id;

      const user = await getUserService().getById(userId);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Transform user data for frontend (exclude sensitive fields)
      const transformedUser = {
        id: user.id,
        email: user.email,
        organization_id: user.organization_id,
        status: user.status,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      };

      return NextResponse.json({
        data: transformedUser,
        success: true,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requiresRoles(request, ['SUPER_ADMIN'], async (authRequest: AuthenticatedRequest) => {
    try {
      const userId = params.id;
      const body = await request.json();
      const { email, organization_id, status } = body;

      // Validate required fields
      if (!email || !organization_id) {
        return NextResponse.json(
          { error: 'Email and organization are required' },
          { status: 400 }
        );
      }

      // Validate email format
      if (!/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await getUserService().getById(userId);
      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if email is already taken by another user
      const userWithEmail = await getUserService().getByEmail(email);
      if (userWithEmail && userWithEmail.id !== userId) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }

      // Update user
      const updatedUser = await getUserService().update(userId, {
        email,
        organization_id,
        status: status || existingUser.status,
        updated_by: authRequest.user!.id,
      });

      // Transform response
      const transformedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        organization_id: updatedUser.organization_id,
        status: updatedUser.status,
        created_at: updatedUser.created_at.toISOString(),
        updated_at: updatedUser.updated_at.toISOString(),
      };

      return NextResponse.json({
        data: transformedUser,
        success: true,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requiresRoles(request, ['SUPER_ADMIN'], async (authRequest: AuthenticatedRequest) => {
    try {
      const userId = params.id;

      // Check if user exists
      const user = await getUserService().getById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Prevent deletion of super admin users for safety
      if (user.email === 'superadmin@hrsystem.com') {
        return NextResponse.json(
          { error: 'Cannot delete system super admin user' },
          { status: 403 }
        );
      }

      // Delete user
      await getUserService().delete(userId);

      return NextResponse.json({
        message: 'User deleted successfully',
        success: true,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
