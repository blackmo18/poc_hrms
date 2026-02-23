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

export async function GET(request: NextRequest) {
  return requiresAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      
      // Extract query parameters
      const organizationId = searchParams.get('organizationId');
      const departmentId = searchParams.get('departmentId');
      const periodStart = searchParams.get('periodStart');
      const periodEnd = searchParams.get('periodEnd');
      const status = searchParams.get('status');
      const employeeId = searchParams.get('employeeId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      // Validate required parameters
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 }
        );
      }

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

      // If no period specified, use current month
      const startDate = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = periodEnd ? new Date(periodEnd) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      // Generate comprehensive payroll summary
      const summary = await payrollSummaryService.generateSummary(
        organizationId,
        departmentId || undefined,
        startDate,
        endDate,
        { status, employeeId, page, limit }
      );

      return NextResponse.json(summary);
    } catch (error) {
      console.error('Error fetching payroll summary:', error);

      return NextResponse.json(
        { error: 'Failed to fetch payroll summary' },
        { status: 500 }
      );
    }
  });
}

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
