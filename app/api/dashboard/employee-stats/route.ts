import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { getEmployeeService, getTimeEntryService, getLeaveRequestService, overtimeRequestService, timeBreakService } from '@/lib/service';

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

    // First get the employee to get the employeeId
    const employee = await employeeService.getByUserId(userId);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employeeId = employee.id; // Get the employee ID from the found employee

    // Fetch data in parallel
    const [todayTimeEntries, weekTimeEntries, monthTimeEntries, employeeLeaveRequests, allOvertimeRequests] = await Promise.all([
      timeEntryService.getByEmployeeAndDateRange(employeeId, todayStart, todayEnd),
      timeEntryService.getByEmployeeAndDateRange(employeeId, weekStart, weekEnd),
      timeEntryService.getByEmployeeAndDateRange(employeeId, monthStart, monthEnd),
      leaveRequestService.getByEmployeeId(employeeId),
      overtimeService.getAll({ employeeId: employeeId })
    ]);

    // Calculate hours from time entries
    const calculateHours = (timeEntries: any[], includeCurrentSession = false) => {
      let total = 0;
      
      for (const entry of timeEntries) {
        if (entry.clockInAt && entry.clockOutAt) {
          // Completed entries
          const clockIn = new Date(entry.clockInAt);
          const clockOut = new Date(entry.clockOutAt);
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          total += hours;
        } else if (includeCurrentSession && entry.clockInAt && !entry.clockOutAt && entry.status === 'OPEN') {
          // Current open session - calculate hours from clock-in to now
          const clockIn = new Date(entry.clockInAt);
          const now = new Date();
          const hours = (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          total += hours;
        }
      }
      return total;
    };

    const calculateOvertimeHours = (approvedOvertimeRequests: any[]) => {
      return approvedOvertimeRequests.reduce((total: number, request: any) => {
        // Only count APPROVED overtime requests
        if (request.status === 'APPROVED' && request.approvedMinutes) {
          // Convert approved minutes to hours
          return total + (request.approvedMinutes / 60);
        }
        return total;
      }, 0);
    };

    // Employee requests are already filtered by the service calls
    const employeeOvertimeRequests = allOvertimeRequests.data || [];

    // Calculate remaining leave days (using a default balance if not set)
    const totalLeaveDays = 20; // Default leave balance
    const usedLeaveDays = employeeLeaveRequests.reduce((total: number, request: any) => {
      if (request.status === 'APPROVED') {
        return total + (request.totalMinutes ? request.totalMinutes / (8 * 60) : 0); // Convert minutes to days
      }
      return total;
    }, 0);

    // Count pending requests
    const pendingLeaveRequests = employeeLeaveRequests.filter((request: any) => request.status === 'PENDING').length;
    const pendingOvertimeRequests = employeeOvertimeRequests.filter((request: any) => request.status === 'PENDING').length;

    // Check if employee is currently clocked in using the service method
    const isClockedIn = await timeEntryService.isClockedIn(employeeId);
    const currentStatus = isClockedIn ? 'clocked_in' : 'not_clocked_in';
    
    // Get the latest entry for time display
    const latestEntry = todayTimeEntries.length > 0 ? todayTimeEntries[todayTimeEntries.length - 1] : null;
    
    // Get break data for the latest time entry
    let breakTime = undefined;
    if (latestEntry && latestEntry.status === 'OPEN') {
      try {
        const breaks = await timeBreakService.getByTimeEntryId(latestEntry.id);
        // Find the most recent break (could be ongoing or completed)
        const latestBreak = breaks
          .sort((a: any, b: any) => new Date(b.breakStartAt).getTime() - new Date(a.breakStartAt).getTime())[0];
        
        if (latestBreak) {
          breakTime = latestBreak.breakStartAt.toISOString();
        }
      } catch (error) {
        console.log('No break data found for current entry:', error);
      }
    }

    // Calculate on-time and late arrival counts for this week
    // Default work start time is 9:00 AM (can be made configurable based on work schedule)
    const WORK_START_HOUR = 9;
    
    const calculateAttendanceMetrics = (timeEntries: any[]) => {
      let onTimeCount = 0;
      let lateCount = 0;
      
      // Group entries by date to get one clock-in per day
      const dailyEntries = new Map();
      
      timeEntries.forEach(entry => {
        if (entry.clockInAt) {
          const clockInDate = new Date(entry.clockInAt).toDateString();
          if (!dailyEntries.has(clockInDate) || 
              new Date(entry.clockInAt) < new Date(dailyEntries.get(clockInDate).clockInAt)) {
            dailyEntries.set(clockInDate, entry);
          }
        }
      });
      
      // Check each day's first clock-in time
      dailyEntries.forEach(entry => {
        const clockInTime = new Date(entry.clockInAt);
        const clockInHour = clockInTime.getHours();
        
        if (clockInHour <= WORK_START_HOUR) {
          onTimeCount++;
        } else if (clockInHour <= WORK_START_HOUR + 1) { // Within 1 hour grace period
          lateCount++;
        }
        // Ignore arrivals more than 1 hour late (could be special cases)
      });
      
      return { onTimeCount, lateCount };
    };
    
    const weekAttendance = calculateAttendanceMetrics(weekTimeEntries);

    const stats = {
      todayHours: calculateHours(todayTimeEntries, true), // Include current session for today
      weekHours: calculateHours(weekTimeEntries),
      monthHours: calculateHours(monthTimeEntries),
      overtimeHours: calculateOvertimeHours(employeeOvertimeRequests), // Use approved overtime requests
      remainingLeave: totalLeaveDays - usedLeaveDays,
      pendingRequests: pendingLeaveRequests + pendingOvertimeRequests,
      todayStatus: currentStatus,
      clockInTime: latestEntry?.clockInAt ? latestEntry.clockInAt.toISOString() : undefined,
      breakTime: breakTime,
      lastClockOut: latestEntry?.clockOutAt ? latestEntry.clockOutAt.toISOString() : undefined,
      onTimeEntries: weekAttendance.onTimeCount,
      lateArrivals: weekAttendance.lateCount
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee dashboard stats' },
      { status: 500 }
    );
  }
}
