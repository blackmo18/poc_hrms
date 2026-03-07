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

    // Fetch data in parallel
    const [employee, todayTimeEntries, weekTimeEntries, monthTimeEntries, employeeLeaveRequests, allOvertimeRequests] = await Promise.all([
      employeeService.getById(userId),
      timeEntryService.getByEmployeeAndDateRange(userId, todayStart, todayEnd),
      timeEntryService.getByEmployeeAndDateRange(userId, weekStart, weekEnd),
      timeEntryService.getByEmployeeAndDateRange(userId, monthStart, monthEnd),
      leaveRequestService.getByEmployeeId(userId),
      overtimeService.getAll({ employeeId: userId })
    ]);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Calculate hours from time entries
    const calculateHours = (timeEntries: any[]) => {
      return timeEntries.reduce((total: number, entry: any) => {
        if (entry.clockInAt && entry.clockOutAt) {
          const clockIn = new Date(entry.clockInAt);
          const clockOut = new Date(entry.clockOutAt);
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0);
    };

    const calculateOvertimeHours = (timeEntries: any[]) => {
      return timeEntries.reduce((total: number, entry: any) => {
        if (entry.clockInAt && entry.clockOutAt) {
          const clockIn = new Date(entry.clockInAt);
          const clockOut = new Date(entry.clockOutAt);
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          // Overtime is anything over 8 hours per day
          const overtime = Math.max(0, hours - 8);
          return total + overtime;
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
    const isClockedIn = await timeEntryService.isClockedIn(userId);
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

    const stats = {
      todayHours: calculateHours(todayTimeEntries),
      weekHours: calculateHours(weekTimeEntries),
      monthHours: calculateHours(monthTimeEntries),
      overtimeHours: calculateOvertimeHours(monthTimeEntries),
      remainingLeave: totalLeaveDays - usedLeaveDays,
      pendingRequests: pendingLeaveRequests + pendingOvertimeRequests,
      todayStatus: currentStatus,
      clockInTime: latestEntry?.clockInAt ? latestEntry.clockInAt.toISOString() : undefined,
      breakTime: breakTime,
      lastClockOut: latestEntry?.clockOutAt ? latestEntry.clockOutAt.toISOString() : undefined
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
