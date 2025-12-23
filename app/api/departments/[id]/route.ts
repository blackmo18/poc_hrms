import { NextRequest, NextResponse } from 'next/server';
import { departmentController } from '@/lib/controllers/department.controller';
import { requiresRoles } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { id } = await params;

      // Create session object for controller
      const session = { user: { id: authRequest.user.id.toString() } };

      const department = await departmentController.getById(session, id);

      if (!department) {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(department);
    } catch (error: any) {
      console.error('Error fetching department:', error);

      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 401 }
        );
      }

      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (error.message === 'Department not found') {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch department' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // Create session object for controller
      const session = { user: { id: authRequest.user.id.toString() } };

      const department = await departmentController.update(session, id, body);

      return NextResponse.json(department);
    } catch (error: any) {
      console.error('Error updating department:', error);

      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 401 }
        );
      }

      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (error.message === 'Department not found') {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to update department' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { id } = await params;

      // Create session object for controller
      const session = { user: { id: authRequest.user.id.toString() } };

      await departmentController.delete(session, id);
      return NextResponse.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting department:', error);

      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 401 }
        );
      }

      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (error.message === 'Department not found') {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to delete department' },
        { status: 500 }
      );
    }
  });
}
