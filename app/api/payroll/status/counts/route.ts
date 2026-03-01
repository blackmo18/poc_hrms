import { NextRequest, NextResponse } from 'next/server';
import { requiresAdmin } from '@/lib/auth/middleware';
import { payrollSummaryService } from '@/lib/service/payroll-summary.service';

export async function GET(request: NextRequest) {
  return requiresAdmin(request, async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      
      // Extract query parameters
      const organizationId = searchParams.get('organizationId');
      const departmentId = searchParams.get('departmentId');
      const periodStart = searchParams.get('periodStart');
      const periodEnd = searchParams.get('periodEnd');

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

      // Get status counts
      const statusCounts = await payrollSummaryService.getStatusCounts(
        organizationId,
        departmentId || undefined,
        startDate,
        endDate
      );

      return NextResponse.json(statusCounts);
    } catch (error) {
      console.error('Error fetching payroll status counts:', error);

      return NextResponse.json(
        { error: 'Failed to fetch payroll status counts' },
        { status: 500 }
      );
    }
  });
}
