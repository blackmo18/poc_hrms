import { NextRequest, NextResponse } from 'next/server';
import { departmentController } from '@/lib/controllers/department.controller';
import { CreateDepartmentSchema } from '@/lib/models/department';
import { requiresRoles } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requiresRoles(request, ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '15');

      // Create session object for controller
      const session = { user: { id: authRequest.user.id.toString() } };

      const result = await departmentController.getAll(session, organizationId ? Number(organizationId) : undefined, page, limit);

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error fetching departments:', error);

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

      return NextResponse.json(
        { error: error.message || 'Failed to fetch departments' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresRoles(request, ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const body = await request.json();
      const validatedData = CreateDepartmentSchema.parse(body);

      // Create session object for controller
      const session = { user: { id: authRequest.user.id.toString() } };

      const department = await departmentController.create(session, validatedData);
      return NextResponse.json(department, { status: 201 });
    } catch (error: any) {
      console.error('Error creating department:', error);

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

      return NextResponse.json(
        { error: error.message || 'Failed to create department' },
        { status: 500 }
      );
    }
  });
}
