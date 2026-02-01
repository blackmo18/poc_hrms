import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { payrollSummaryService } from '@/lib/service/payroll-summary.service';
import { requiresAdmin, requiresPermissions } from '@/lib/auth/middleware';

const payrollSummaryRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  departmentId: z.string().optional(),
  cutoffPeriod: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (use YYYY-MM-DD)'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (use YYYY-MM-DD)'),
  }),
});

export async function POST(request: NextRequest) {
  return requiresAdmin(request,  async (authRequest) => {
    try {
      const body = await request.json();
      const validatedData = payrollSummaryRequestSchema.parse(body);

      const { organizationId, departmentId, cutoffPeriod } = validatedData;

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

      const periodStart = new Date(cutoffPeriod.start);
      const periodEnd = new Date(cutoffPeriod.end);

      // Generate comprehensive payroll summary
      const summary = await payrollSummaryService.generateSummary(
        organizationId,
        departmentId,
        periodStart,
        periodEnd
      );

      return NextResponse.json(summary);
    } catch (error) {
      console.error('Error generating payroll summary:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate payroll summary' },
        { status: 500 }
      );
    }
  });
}
