import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntryService } from '@/lib/service/time-entry.service';
import { getEmployeeService } from '@/lib/service/employee.service';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['timesheet.own.read'], async (authRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      if (!startDateStr || !endDateStr) {
        return NextResponse.json(
          { error: 'startDate and endDate query parameters are required' },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }

      const timeEntryService = getTimeEntryService();
      const user = authRequest.user!;

      // Get employee to filter by employee
      const employeeService = getEmployeeService();
      const employee = await employeeService.getByUserId(user.id);
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      // Get time entries for the date range
      const entries = await timeEntryService.getByEmployeeAndDateRange(
        employee.id,
        startDate,
        endDate
      );

      // Format the response
      const formattedData = (entries.data || []).map((entry: any) => ({
        id: entry.id,
        date: entry.clockInAt ? new Date(entry.clockInAt).toISOString().split('T')[0] : '',
        startTime: entry.clockInAt ? new Date(entry.clockInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        endTime: entry.clockOutAt ? new Date(entry.clockOutAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        duration: entry.clockOutAt && entry.clockInAt 
          ? Math.round((new Date(entry.clockOutAt).getTime() - new Date(entry.clockInAt).getTime()) / (1000 * 60 * 60) * 10) / 10
          : 0,
      }));

      return NextResponse.json({
        success: true,
        data: formattedData,
        count: formattedData.length,
      });
    } catch (error) {
      console.error('Timesheets fetch error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
