import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requiresAdmin } from '@/lib/auth/middleware';
import { getEmployeeService } from '@/lib/service/employee.service';
import { timeEntryService } from '@/lib/service/time-entry.service';
import { getDepartmentService } from '@/lib/service/department.service';

const missingAttendanceRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  departmentId: z.string().optional(),
  cutoffPeriod: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (use YYYY-MM-DD)'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (use YYYY-MM-DD)'),
  }),
});

function countWeekdays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // 0 = Sunday, 6 = Saturday
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

export async function POST(request: NextRequest) {
  return requiresAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const validatedData = missingAttendanceRequestSchema.parse(body);

      const { organizationId, departmentId, cutoffPeriod } = validatedData;

      // Check user permissions
      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      if (!isSuperAdmin && !isAdmin && (!isHRManager || organizationId !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot access payroll data for this organization' },
          { status: 403 }
        );
      }

      const periodStart = new Date(cutoffPeriod.start);
      const periodEnd = new Date(cutoffPeriod.end);

      // Get all employees in the organization/department
      const employeeService = getEmployeeService();
      const employeesResult = await employeeService.getAll(organizationId, departmentId, { page: 1, limit: 1000 });
      const employees = employeesResult.data;

      // Get time entries for the period using the time entry service
      const timeEntries = await timeEntryService.getTimeEntriesByOrganizationAndPeriod(
        organizationId,
        departmentId,
        periodStart,
        periodEnd,
        undefined // status parameter
      );

      // Count unique employees with time entries
      const employeesWithRecords = new Set(timeEntries.map(te => te.employeeId));

      // Get department service for department names
      // Note: Simplified to use departmentId directly since department service requires session
      const departmentService = getDepartmentService();

      // Find employees missing attendance
      const missingAttendanceEmployees = await Promise.all(
        employees
          .filter(employee => !employeesWithRecords.has(employee.id))
          .map(async (employee: any) => {
            // Use department name from the included relation
            const departmentName = employee.department?.name || 'Unknown';

            // Calculate expected work days and missing hours
            const weekdays = countWeekdays(periodStart, periodEnd);
            const expectedHours = weekdays * 8; // Assuming 8 hours per day

            return {
              id: employee.id,
              employeeId: employee.employeeId || employee.id,
              name: `${employee.firstName} ${employee.lastName}`,
              department: departmentName,
              missingHours: expectedHours,
            };
          })
      );

      return NextResponse.json({
        success: true,
        data: missingAttendanceEmployees,
      });
    } catch (error) {
      console.error('Error fetching missing attendance:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch missing attendance data' },
        { status: 500 }
      );
    }
  });
}
