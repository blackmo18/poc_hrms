import { NextRequest, NextResponse } from 'next/server';
import { getCompensationService } from '@/lib/service/compensation.service';
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
          { error: 'Access denied to this employee\'s compensation history' },
          { status: 403 }
        );
      }

      const compensations = await compensationService.getByEmployeeId(employeeId);
      
      // Sort by effective date descending to get most recent first
      compensations.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

      // Calculate salary changes
      const compensationHistory = compensations.map((comp, index) => {
        const previousSalary = index < compensations.length - 1 ? compensations[index + 1].baseSalary : null;
        const salaryChange = previousSalary ? comp.baseSalary - previousSalary : 0;
        const salaryChangePercentage = previousSalary ? ((comp.baseSalary - previousSalary) / previousSalary) * 100 : 0;

        return {
          ...comp,
          previousSalary,
          salaryChange,
          salaryChangePercentage: parseFloat(salaryChangePercentage.toFixed(2)),
        };
      });

      return NextResponse.json(compensationHistory);
    } catch (error) {
      console.error('Error fetching compensation history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch compensation history' },
        { status: 500 }
      );
    }
  });
}
