import { NextRequest, NextResponse } from 'next/server';
import { employeeController } from '@/lib/controllers/employee.controller';
import { CreateEmployeeSchema } from '@/lib/models/employee';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['employees.read'], async (authRequest) => {
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
    const isAdmin = user.roles.includes('ADMIN');
    const isHRManager = user.roles.includes('HR_MANAGER');

    let result;

    if (isAdmin) {
      // Admin can see all employees, optionally filtered by organization
      result = await employeeController.getAll(
        organizationId ? Number(organizationId) : undefined,
        { page, limit }
      );
    } else if (isHRManager) {
      // HR Manager can only see employees from their own organization
      result = await employeeController.getAll(user.organizationId, { page, limit });
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
  return requiresPermissions(request, ['employees.create'], async (authRequest) => {
    try {
      const body = await request.json();
      const validatedData = CreateEmployeeSchema.parse(body);

      // Get user info from auth request
      const user = authRequest.user!;

      // Check if user can create employees for the specified organization
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      if (!isAdmin && (!isHRManager || validatedData.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot create employees for this organization' },
          { status: 403 }
        );
      }

      const employee = await employeeController.create(validatedData);
      return NextResponse.json(employee, { status: 201 });
    } catch (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json(
        { error: 'Failed to create employee' },
        { status: 500 }
      );
    }
  });
}
