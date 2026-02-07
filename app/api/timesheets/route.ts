import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntryService } from '@/lib/service/time-entry.service';
import { getEmployeeService } from '@/lib/service/employee.service';
import { requiresPermissions } from '@/lib/auth/middleware';
import { getUserPermissionsForUser } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['timesheet.own.read', 'timesheet.admin.read'], async (authRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const employeeIdParam = searchParams.get('employeeId');

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

    // Note: For date field filtering, we don't need to add 1 day since the comparison is inclusive
    // The workDate field is filtered as workDate >= startDate AND workDate <= endDate
    const adjustedEndDate = endDate;

    const timeEntryService = getTimeEntryService();
    const user = authRequest.user!;

    // Get employee service
    const employeeService = getEmployeeService();
    let targetEmployee;

    if (employeeIdParam) {
      // Admin viewing another employee's data
      // Check if user has admin permissions for timesheets
      const userPermissions = await getUserPermissionsForUser(user.id);
      const hasAdminPermission = userPermissions.includes('timesheet.admin.read');
      if (!hasAdminPermission) {
        return NextResponse.json({ error: 'Insufficient permissions to view other employees\' timesheets' }, { status: 403 });
      }
      
      targetEmployee = await employeeService.getById(employeeIdParam);
      if (!targetEmployee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
    } else {
      // User viewing their own data
      targetEmployee = await employeeService.getByUserId(user.id);
      if (!targetEmployee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
    }

    // Get time entries for the date range
    const entries = await timeEntryService.getByEmployeeAndDateRange(
      targetEmployee.id,
      startDate,
      adjustedEndDate
    );

    // Format the response
    const formattedData = (entries || []).map((entry: any) => ({
      id: entry.id,
      employeeId: targetEmployee.id,
      employeeName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown',
      date: entry.clockInAt ? new Date(entry.clockInAt).toISOString().split('T')[0] : '',
      startTime: entry.clockInAt ? new Date(entry.clockInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      endTime: entry.clockOutAt ? new Date(entry.clockOutAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      duration: entry.clockOutAt && entry.clockInAt 
        ? Math.round((new Date(entry.clockOutAt).getTime() - new Date(entry.clockInAt).getTime()) / (1000 * 60 * 60) * 10) / 10
        : 0,
      status: entry.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      targetEmployee: employeeIdParam ? {
        id: targetEmployee.id,
        name: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
        email: targetEmployee.email,
      } : null,
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
