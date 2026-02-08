import { NextRequest, NextResponse } from 'next/server';
import { overtimeRequestController } from '@/lib/controllers/overtime-request.controller';
import { requiresRoles } from '@/lib/auth/middleware';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const organization = searchParams.get('organization');
      const cutoff = searchParams.get('cutoff');

      const filters: any = {};

      // Filter by organization
      if (organization && organization !== 'All') {
        filters.organizationId = organization;
      }

      // Filter by cutoff period
      if (cutoff && cutoff !== 'All') {
        let dateFrom: Date;
        let dateTo: Date;

        // Check if cutoff is in the format 'YYYY-M-D-D' (from usePayrollPeriods)
        const cutoffParts = cutoff.split('-');
        if (cutoffParts.length === 4) {
          const [year, month, startDay, endDay] = cutoffParts.map(Number);
          dateFrom = new Date(year, month - 1, startDay); // month is 1-based
          dateTo = new Date(year, month - 1, endDay);
        } else {
          // Fallback for other formats like 'this-month'
          const now = new Date();
          if (cutoff === 'this-month') {
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            dateTo = new Date(now);
          } else if (cutoff === 'last-month') {
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
          } else if (cutoff === 'this-year') {
            dateFrom = new Date(now.getFullYear(), 0, 1);
            dateTo = new Date(now);
          } else {
            // Default to this month
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            dateTo = new Date(now);
          }
        }

        // Validate dates and apply other handlings
        if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime()) || dateFrom > dateTo) {
          console.error('Invalid date range for cutoff:', cutoff, dateFrom, dateTo);
          // Fallback to current month
          const now = new Date();
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          dateTo = new Date(now);
        }

        filters.date_from = dateFrom;
        filters.date_to = dateTo;
      }

      const result = await overtimeRequestController.getAll(filters, { page: 1, limit: 1000 });
      
      // Transform data to match the expected format
      const transformedData = result.data.map((item: any) => ({
        id: item.id,
        employee: `${item.employee.firstName} ${item.employee.lastName}`,
        department: item.employee.department?.name || 'N/A',
        organization: item.organizationId,
        date: item.workDate.toISOString().split('T')[0],
        otType: item.otType,
        requestedHours: item.requestedMinutes / 60,
        reason: item.reason,
        status: item.status.toLowerCase(),
        submittedDate: item.createdAt.toISOString().split('T')[0],
        approvedBy: item.approvedByUser?.employee ? `${item.approvedByUser.employee.firstName} ${item.approvedByUser.employee.lastName}` : null,
      }));

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error('Error fetching overtime requests:', error);
      return NextResponse.json({ error: 'Failed to fetch overtime requests' }, { status: 500 });
    }
  });
}
