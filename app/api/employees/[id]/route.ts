import { NextRequest, NextResponse } from 'next/server';
import { employeeController } from '@/lib/controllers/employee.controller';
import { UpdateEmployeeSchema } from '@/lib/models/employee';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['employees.read'], async (authRequest) => {
    try {
      const { id } = await params;
      const employeeId = parseInt(id);
      if (isNaN(employeeId)) {
        return NextResponse.json(
          { error: 'Invalid employee ID' },
          { status: 400 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      const employee = await employeeController.getById(employeeId);

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      // Check organization access
      if (!isAdmin && (!isHRManager || employee.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Access denied to this employee' },
          { status: 403 }
        );
      }

      return NextResponse.json(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['employees.update'], async (authRequest) => {
    try {
      const { id } = await params;
      const employeeId = parseInt(id);
      if (isNaN(employeeId)) {
        return NextResponse.json(
          { error: 'Invalid employee ID' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const validatedData = UpdateEmployeeSchema.parse(body);

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Check if employee exists and user has access
      const existingEmployee = await employeeController.getById(employeeId);
      if (!existingEmployee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      // Check organization access
      if (!isAdmin && (!isHRManager || existingEmployee.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot update employees from this organization' },
          { status: 403 }
        );
      }

      const employee = await employeeController.update(employeeId, validatedData);
      return NextResponse.json(employee);
    } catch (error) {
      console.error('Error updating employee:', error);
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['employees.delete'], async (authRequest) => {
    try {
      const { id } = await params;
      const employeeId = parseInt(id);
      if (isNaN(employeeId)) {
        return NextResponse.json(
          { error: 'Invalid employee ID' },
          { status: 400 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Check if employee exists and user has access
      const existingEmployee = await employeeController.getById(employeeId);
      if (!existingEmployee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      // Check organization access
      if (!isAdmin && (!isHRManager || existingEmployee.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot delete employees from this organization' },
          { status: 403 }
        );
      }

      await employeeController.delete(employeeId);
      return NextResponse.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json(
        { error: 'Failed to delete employee' },
        { status: 500 }
      );
    }
  });
}
