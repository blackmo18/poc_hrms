import { NextRequest, NextResponse } from 'next/server';
import { getCompensationService } from '@/lib/service/compensation.service';
import { CreateCompensationSchema } from '@/lib/models/compensation';
import { requiresPermissions } from '@/lib/auth/middleware';
import { employeeController } from '@/lib/controllers/employee.controller';

const compensationService = getCompensationService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['compensation.read'], async (authRequest) => {
    try {
      const { id } = await params;
      const employeeId = id;

      // Check if employee exists and user has access
      const employee = await employeeController.getById(employeeId);
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Check organization access
      if (!isAdmin && (!isHRManager || employee.organizationId !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Access denied to this employee\'s compensation' },
          { status: 403 }
        );
      }

      const compensations = await compensationService.getByEmployeeId(employeeId);
      
      // Sort by effective date descending to get most recent first
      compensations.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

      return NextResponse.json(compensations);
    } catch (error) {
      console.error('Error fetching employee compensations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee compensations' },
        { status: 500 }
      );
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['compensation.create'], async (authRequest) => {
    try {
      const { id } = await params;
      const employeeId = id;

      // Check if employee exists and user has access
      const employee = await employeeController.getById(employeeId);
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Check organization access
      if (!isAdmin && (!isHRManager || employee.organizationId !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot create compensation for this employee' },
          { status: 403 }
        );
      }

      const body = await request.json();

      // Parse effectiveDate
      if (body.effectiveDate) {
        body.effectiveDate = new Date(body.effectiveDate);
      }

      // Set employeeId and organizationId from the employee
      const compensationData = {
        ...body,
        employeeId,
        organizationId: employee.organizationId,
        departmentId: employee.departmentId,
      };

      const validatedData = CreateCompensationSchema.parse(compensationData);

      const compensation = await compensationService.create(validatedData);
      return NextResponse.json(compensation, { status: 201 });
    } catch (error) {
      console.error('Error creating employee compensation:', error);
      return NextResponse.json(
        { error: 'Failed to create employee compensation' },
        { status: 500 }
      );
    }
  });
}
