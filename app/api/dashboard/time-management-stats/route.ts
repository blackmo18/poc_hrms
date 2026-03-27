import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { getEmployeeService, getTimeEntryService, getLeaveRequestService, overtimeRequestService } from '@/lib/service';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const today = new Date();

    // Get date ranges
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get services
    const employeeService = getEmployeeService();
    const timeEntryService = getTimeEntryService();
    const leaveRequestService = getLeaveRequestService();
    const overtimeService = overtimeRequestService;

    // Fetch data in parallel
    const [allEmployees, todayTimeEntries, weekTimeEntries, monthTimeEntries, allLeaveRequests, allOvertimeRequests] = await Promise.all([
      employeeService.getAll(),
      timeEntryService.getByEmployeeAndDateRange(userId, todayStart, todayEnd),
      timeEntryService.getByEmployeeAndDateRange(userId, weekStart, weekEnd),
      timeEntryService.getByEmployeeAndDateRange(userId, monthStart, monthEnd),
      leaveRequestService.getAll(),
      overtimeService.getAll({})
    ]);

    const totalEmployees = allEmployees.data.filter(e => e.employmentStatus === 'ACTIVE').length;
    
    // Calculate today's stats
    const activeToday = todayTimeEntries.filter(entry => entry.status === 'OPEN').length;
    const onTimeToday = todayTimeEntries.filter(entry => {
      const clockInTime = new Date(entry.clockInAt);
      return clockInTime.getHours() <= 8 && clockInTime.getMinutes() <= 30; // Before 8:30 AM
    }).length;
    const lateToday = todayTimeEntries.filter(entry => {
      const clockInTime = new Date(entry.clockInAt);
      return clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 30);
    }).length;

    // Calculate total hours
    const totalHoursToday = todayTimeEntries.reduce((total, entry) => {
      if (entry.totalWorkMinutes) {
        return total + entry.totalWorkMinutes / 60;
      }
      return total;
    }, 0);

    const overtimeHoursToday = todayTimeEntries.reduce((total, entry) => {
      if (entry.totalWorkMinutes && entry.totalWorkMinutes > 8 * 60) {
        return total + (entry.totalWorkMinutes - 8 * 60) / 60;
      }
      return total;
    }, 0);

    // Calculate monthly overtime
    const monthlyOvertime = monthTimeEntries.reduce((total, entry) => {
      if (entry.totalWorkMinutes && entry.totalWorkMinutes > 8 * 60) {
        return total + (entry.totalWorkMinutes - 8 * 60) / 60;
      }
      return total;
    }, 0);

    // Calculate weekly attendance rate
    const weeklyAttendance = weekTimeEntries.length > 0 
      ? (weekTimeEntries.filter(entry => entry.status === 'CLOSED').length / weekTimeEntries.length) * 100
      : 0;

    // Get pending counts
    const pendingCorrections = allLeaveRequests.data.filter(lr => lr.status === 'PENDING').length;
    const timesheetPending = allOvertimeRequests.data.filter(or => or.status === 'PENDING').length;
    const timesheetSubmitted = allOvertimeRequests.data.filter(or => or.status === 'APPROVED').length;

    // Mock some values for now (these would need additional business logic)
    const nightShiftActive = Math.floor(totalEmployees * 0.1); // 10% night shift
    const breakCompliance = 95.5; // Mock compliance rate

    const stats = {
      totalEmployees,
      activeToday,
      onTimeToday,
      lateToday,
      totalHoursToday,
      overtimeHoursToday,
      pendingCorrections,
      nightShiftActive,
      weeklyAttendance,
      monthlyOvertime,
      breakCompliance,
      timesheetSubmitted,
      timesheetPending
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching time management stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time management stats' },
      { status: 500 }
    );
  }
}
