import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { employeePayrollService } from '@/lib/service/employee-payroll.service';
import { requiresAdmin, requiresPermissions } from '@/lib/auth/middleware';

const employeePayrollRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  cutoffPeriod: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (use YYYY-MM-DD)'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (use YYYY-MM-DD)'),
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresAdmin(request, async (authRequest) => {
    try {
      const { id: employeeId } = await params;
      
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');
      const periodStart = searchParams.get('periodStart');
      const periodEnd = searchParams.get('periodEnd');

      if (!organizationId || !periodStart || !periodEnd) {
        return NextResponse.json(
          { error: 'Missing required query parameters: organizationId, periodStart, periodEnd' },
          { status: 400 }
        );
      }

      // Validate dates
      const validatedData = employeePayrollRequestSchema.parse({
        organizationId,
        cutoffPeriod: {
          start: periodStart,
          end: periodEnd,
        },
      });
      
      console.log(`[DEBUG] API - Period start: ${periodStart}, Period end: ${periodEnd}`);
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      console.log(`[DEBUG] API - Parsed dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`[DEBUG] API - Valid dates:`, !isNaN(startDate.getTime()), !isNaN(endDate.getTime()));

      // Check user permissions for the organization
      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Super Admin can access any organization
      // Admin and HR Manager can only access their own organization
      if (!isSuperAdmin && !isAdmin && (!isHRManager || organizationId !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot access payroll data for this organization' },
          { status: 403 }
        );
      }

      // Get payroll data from service
      const payrollData = await employeePayrollService.getEmployeePayroll(
        employeeId,
        organizationId,
        startDate,
        endDate
      );

      return NextResponse.json(payrollData);
    } catch (error) {
      console.error('Error fetching employee payroll:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee payroll' },
        { status: 500 }
      );
    }
  });
}
