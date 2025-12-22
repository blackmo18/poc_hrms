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
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isAdmin = user.roles.includes('ADMIN');
    const isHRManager = user.roles.includes('HR_MANAGER');

    let result;

    if (isSuperAdmin) {
      // Super Admin can see all employees across all organizations
      result = await employeeController.getAll(
        organizationId ? Number(organizationId) : undefined,
        { page, limit }
      );
    } else if (isAdmin) {
      // Admin can see employees in their organization only
      result = await employeeController.getAll(user.organizationId, { page, limit });
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

      // Handle personal_email: empty string or null should be treated as undefined
      if (body.personal_email === '' || body.personal_email === null) {
        delete body.personal_email;
      }

      // Parse date strings to Date objects
      if (body.date_of_birth) {
        body.date_of_birth = new Date(body.date_of_birth);
      }
      if (body.hire_date) {
        body.hire_date = new Date(body.hire_date);
      }

      const validatedData = CreateEmployeeSchema.parse(body);

      // Get user info from auth request
      const user = authRequest.user!;

      // Check if user can create employees for the specified organization
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Super Admin can create employees for any organization
      // Admin and HR Manager can only create for their own organization
      if (!isSuperAdmin && !isAdmin && (!isHRManager || validatedData.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot create employees for this organization' },
          { status: 403 }
        );
      }

      // Admin can only create for their own organization
      if (isAdmin && !isSuperAdmin && validatedData.organization_id !== user.organizationId) {
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
