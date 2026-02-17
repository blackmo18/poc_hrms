import { NextRequest, NextResponse } from 'next/server';
import { EmployeeGovernmentInfoController } from '@/lib/controllers/employee-government-info.controller';
import { requiresPermissions } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';

const employeeGovernmentInfoController = new EmployeeGovernmentInfoController(prisma);

export async function PUT(request: NextRequest) {
  return requiresPermissions(request, ['employees.update'], async (authRequest) => {
    try {
      const body = await request.json();
      const { id, organizationId, ...data } = body;

      if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      }

      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');

      // Validate organization access
      if (!isSuperAdmin && organizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Cannot update employee info for this organization' }, { status: 403 });
      }

      // Validate government numbers
      const validation = await employeeGovernmentInfoController.validateGovernmentNumbers(data);
      if (!validation.isValid) {
        return NextResponse.json({ error: 'Invalid government numbers', details: validation.errors }, { status: 400 });
      }

      const result = await employeeGovernmentInfoController.updateEmployeeGovernmentInfo(
        id,
        organizationId,
        data
      );
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error in employee government info PUT:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update employee government information' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return requiresPermissions(request, ['employees.update'], async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const organizationId = searchParams.get('organizationId');

      if (!id || !organizationId) {
        return NextResponse.json({ error: 'ID and organizationId are required' }, { status: 400 });
      }

      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');

      // Validate organization access
      if (!isSuperAdmin && organizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Cannot delete employee info for this organization' }, { status: 403 });
      }

      const result = await employeeGovernmentInfoController.deleteEmployeeGovernmentInfo(
        id,
        organizationId
      );
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error in employee government info DELETE:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete employee government information' },
        { status: 500 }
      );
    }
  });
}
