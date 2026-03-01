import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requiresAdmin } from '@/lib/auth/middleware';
import { getEmployeeService } from '@/lib/service/employee.service';
import { timeEntryService } from '@/lib/service/time-entry.service';
import { sharedPayrollCalculation } from '@/lib/service/shared-payroll-calculation';

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

      // Calculate employees who hit the absence threshold
      const absenceThreshold = parseInt(process.env.ABSENCE_WARNING_THRESHOLD || '2');
      
      // Find employees who hit the absence threshold
      const employeesHitAbsenceThreshold = await Promise.all(
        employees.map(async (employee: any) => {
          try {
            // Get payroll data for this employee
            const payrollData = await sharedPayrollCalculation.calculatePayroll({
              employeeId: employee.id,
              organizationId: organizationId,
              departmentId: departmentId,
              periodStart: periodStart,
              periodEnd: periodEnd,
              options: {
                persistData: false // Preview mode
              }
            });
            
            const transformedData = await sharedPayrollCalculation.transformToEmployeePayrollData(
              payrollData,
              periodStart,
              periodEnd
            );

            // Check if employee hit the absence threshold
            if (transformedData.attendance.absentDays >= absenceThreshold) {
              // Use department name from the included relation
              const departmentName = employee.department?.name || 'Unknown';

              return {
                id: employee.id,
                employeeId: employee.employeeId || employee.id,
                name: `${employee.firstName} ${employee.lastName}`,
                department: departmentName,
                absentDays: transformedData.attendance.absentDays,
                threshold: absenceThreshold,
              };
            }
            
            return null;
          } catch (error) {
            console.error(`Error checking attendance for employee ${employee.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null values and sort by absent days (descending)
      const missingAttendanceEmployees = employeesHitAbsenceThreshold
        .filter(employee => employee !== null)
        .sort((a: any, b: any) => b.absentDays - a.absentDays);

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
