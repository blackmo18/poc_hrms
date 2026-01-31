import { NextRequest, NextResponse } from 'next/server';
import { requiresPermissions } from '@/lib/auth/middleware';
import { getEmployeeService } from '@/lib/service/employee.service';
import { overtimeController } from '@/lib/controllers/overtime.controller';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['overtime.request'], async (authRequest) => {
    try {
      const user = authRequest.user!;

      // Get employee for the user
      const employeeService = getEmployeeService();
      const employee = await employeeService.getByUserId(user.id);

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee record not found' },
          { status: 404 }
        );
      }

      return overtimeController.getOvertimeRequests(employee.id);
    } catch (error) {
      console.error('Error in overtime API:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['overtime.request'], async (authRequest) => {
    try {
      const user = authRequest.user!;

      // Get employee for the user
      const employeeService = getEmployeeService();
      const employee = await employeeService.getByUserId(user.id);

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee record not found' },
          { status: 404 }
        );
      }

      return overtimeController.createOvertimeRequest(request, employee.id, employee.organizationId);
    } catch (error) {
      console.error('Error in overtime API:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
