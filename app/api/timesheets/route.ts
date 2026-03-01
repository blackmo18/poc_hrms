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

    // Create a map of existing time entries by date
    const entriesByDate = new Map();
    (entries || []).forEach((entry: any) => {
      const dateStr = entry.workDate ? new Date(entry.workDate).toISOString().split('T')[0] : '';
      if (dateStr) {
        entriesByDate.set(dateStr, entry);
      }
    });

    // Generate all dates in the period
    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate attendance records for all dates in the period
    const formattedData = allDates.map(dateStr => {
      const entry = entriesByDate.get(dateStr);
      
      if (entry) {
        // Has time entry
        // Convert UTC times to local timezone based on workDate
        const workDate = new Date(entry.workDate);
        const clockInTime = entry.clockInAt ? new Date(entry.clockInAt) : null;
        const clockOutTime = entry.clockOutAt ? new Date(entry.clockOutAt) : null;
        
        // Format times considering they might be on different days due to UTC
        const formatTime = (date: Date) => {
          // Use the workDate as the reference for timezone
          const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          return localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        };
        
        return {
          id: entry.id,
          employeeId: targetEmployee.id,
          employeeName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown',
          date: dateStr,
          startTime: clockInTime ? formatTime(clockInTime) : '',
          endTime: clockOutTime ? formatTime(clockOutTime) : '',
          duration: entry.totalWorkMinutes ? Math.round(entry.totalWorkMinutes / 60 * 10) / 10 : 0,
          status: entry.status,
          otHours: entry.otHours || 0,
          nightDifferential: entry.nightDifferential || 0,
          lateHours: entry.lateHours || 0,
        };
      } else {
        // No time entry - check if it's a weekday
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
        
        if (isWeekday) {
          // Weekday with no entry = Absent
          return {
            id: `absent-${dateStr}`,
            employeeId: targetEmployee.id,
            employeeName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown',
            date: dateStr,
            startTime: '-',
            endTime: '-',
            duration: 0,
            status: 'absent',
            otHours: 0,
            nightDifferential: 0,
            lateHours: 0,
          };
        } else {
          // Weekend = No Entry
          return {
            id: `weekend-${dateStr}`,
            employeeId: targetEmployee.id,
            employeeName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown',
            date: dateStr,
            startTime: '-',
            endTime: '-',
            duration: 0,
            status: 'weekend',
            otHours: 0,
            nightDifferential: 0,
            lateHours: 0,
          };
        }
      }
    });

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
