import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntryService } from '@/lib/service/time-entry.service';
import { getEmployeeService } from '@/lib/service/employee.service';
import { requiresPermissions } from '@/lib/auth/middleware';
import { getUserPermissionsForUser } from '@/lib/auth/middleware';
import { formatDateToYYYYMMDD, formatUTCDateToYYYYMMDD } from '@/lib/utils/date-utils';
import { 
  ensureUTCForStorage,
  isValidISODate
} from '@/lib/utils/timezone-utils';

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

    // Validate ISO date format
    if (!isValidISODate(startDateStr) || !isValidISODate(endDateStr)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO format (e.g., 2024-01-15T00:00:00.000Z)' },
        { status: 400 }
      );
    }

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

    // Note: Convert date range to UTC for database query
    // The input dates are ISO strings assumed to be in Manila timezone
    const utcStartDate = ensureUTCForStorage(startDateStr);
    const utcEndDate = ensureUTCForStorage(endDateStr);
    
    if (!utcStartDate || !utcEndDate) {
      return NextResponse.json(
        { error: 'Failed to parse dates. Use ISO format' },
        { status: 400 }
      );
    }

    // Get time entries for the date range
    const entries = await timeEntryService.getByEmployeeAndDateRange(
      targetEmployee.id,
      utcStartDate,
      utcEndDate
    );
    
    // Debug: Log the raw entries
    console.log('Raw entries from service:', JSON.stringify(entries, null, 2));

    // Create a map of existing time entries by date
    const entriesByDate = new Map();
    (entries || []).forEach((entry: any) => {
      // Debug: Log the actual workDate value
      console.log('Entry workDate:', entry.workDate, 'type:', typeof entry.workDate);
      
      // Use clockInAt date for accurate date mapping (since workDate might be incorrect)
      if (entry.clockInAt) {
        // Extract date from clockInAt (this is when the employee actually worked)
        const clockInDate = new Date(entry.clockInAt);
        const utcYear = clockInDate.getUTCFullYear();
        const utcMonth = clockInDate.getUTCMonth() + 1; // getUTCMonth() returns 0-11
        const utcDay = clockInDate.getUTCDate();
        const dateStr = `${utcYear}-${String(utcMonth).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`;
        
        console.log('Using clockInAt date:', dateStr);
        console.log('Original workDate:', entry.workDate);
        
        if (dateStr) {
          entriesByDate.set(dateStr, entry);
        }
      } else if (entry.workDate) {
        // Fallback to workDate if no clockInAt
        let dateStr;
        if (typeof entry.workDate === 'string') {
          dateStr = formatUTCDateToYYYYMMDD(entry.workDate);
        } else if (entry.workDate instanceof Date) {
          const utcYear = entry.workDate.getUTCFullYear();
          const utcMonth = entry.workDate.getUTCMonth() + 1;
          const utcDay = entry.workDate.getUTCDate();
          dateStr = `${utcYear}-${String(utcMonth).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`;
        } else {
          dateStr = formatUTCDateToYYYYMMDD(new Date(entry.workDate).toISOString());
        }
        
        console.log('Using workDate fallback:', dateStr);
        if (dateStr) {
          entriesByDate.set(dateStr, entry);
        }
      }
    });

    // Generate all dates in the period
    const allDates: string[] = [];
    const currentDate = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    while (currentDate <= end) {
      // Use utility function to avoid UTC timezone issues
      const dateStr = formatDateToYYYYMMDD(currentDate);
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate attendance records for all dates in the period
    const formattedData = allDates.map(dateStr => {
      const entry = entriesByDate.get(dateStr);
      
      if (entry) {
        // Has time entry
        // Return UTC times directly
        const clockInTime = entry.clockInAt ? entry.clockInAt.toISOString() : null;
        const clockOutTime = entry.clockOutAt ? entry.clockOutAt.toISOString() : null;
        
        return {
          id: entry.id,
          employeeId: targetEmployee.id,
          employeeName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown',
          date: dateStr,
          startTime: clockInTime,
          endTime: clockOutTime,
          duration: entry.totalWorkMinutes ? Math.round(entry.totalWorkMinutes / 60 * 10) / 10 : 0,
          status: entry.status,
          otHours: entry.otHours || 0,
          nightDifferential: entry.nightDifferential || 0,
          lateHours: entry.lateHours || 0,
        };
      } else {
        // No time entry - check if it's a weekday and if it's a future date
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison
        const isFutureDate = date > today;
        const dayOfWeek = date.getDay();
        const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
        
        if (isWeekday) {
          if (isFutureDate) {
            // Future weekday = Blank status
            return {
              id: `future-${dateStr}`,
              employeeId: targetEmployee.id,
              employeeName: targetEmployee ? `${targetEmployee.firstName} ${targetEmployee.lastName}` : 'Unknown',
              date: dateStr,
              startTime: '-',
              endTime: '-',
              duration: 0,
              status: '-',
              otHours: 0,
              nightDifferential: 0,
              lateHours: 0,
            };
          } else {
            // Past weekday with no entry = Absent
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
          }
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
