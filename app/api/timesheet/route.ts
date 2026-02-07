import { NextRequest, NextResponse } from 'next/server';
import { timeBreakService } from '@/lib/service/time-break.service';
import { getEmployeeService } from '@/lib/service/employee.service';
import { requiresPermissions } from '@/lib/auth/middleware';
import { getTimeEntryService } from '@/lib/service';

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['timesheet.own'], async (authRequest) => {
    try {
      const body = await request.json();
      const { type } = body;

      if (!type || !['clockin', 'clockout', 'breakin', 'breakout'].includes(type)) {
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
      }

      const timeEntryService = getTimeEntryService();
      const user = authRequest.user!;

      // Get employee to get organization_id
      const employeeService = getEmployeeService();
      const employee = await employeeService.getByUserId(user.id);
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      let result;

      switch (type) {
        case 'clockin':
          // Check if already clocked in
          const isClockedIn = await timeEntryService.isClockedIn(employee.id);
          if (isClockedIn) {
            return NextResponse.json({ error: 'Already clocked in' }, { status: 400 });
          }

          // Parse workDate from client (client knows local timezone)
          const workDate = body.workDate ? new Date(body.workDate) : undefined;

          result = await timeEntryService.clockIn({
            employeeId: employee.id,
            organizationId: employee.organizationId,
            workDate: workDate,
            createdBy: user.id,
          });
          break;

        case 'clockout':
          const currentEntry = await timeEntryService.getCurrentOpenEntry(employee.id);
          if (!currentEntry) {
            return NextResponse.json({ error: 'No active time entry found' }, { status: 400 });
          }

          result = await timeEntryService.clockOut(currentEntry.id, undefined, user.id);
          break;

        case 'breakin':
          const activeEntryForBreak = await timeEntryService.getCurrentOpenEntry(employee.id);
          if (!activeEntryForBreak) {
            return NextResponse.json({ error: 'No active time entry found' }, { status: 400 });
          }

          await timeBreakService.startBreak({
            employeeId: employee.id,
            timeEntryId: activeEntryForBreak.id,
            createdBy: user.id,
          });

          // Fetch updated entry with breaks
          result = await timeEntryService.getById(activeEntryForBreak.id);
          break;

        case 'breakout':
          const activeEntryForBreakOut = await timeEntryService.getCurrentOpenEntry(employee.id);
          if (!activeEntryForBreakOut) {
            return NextResponse.json({ error: 'No active time entry found' }, { status: 400 });
          }

          await timeBreakService.endBreak({
            employeeId: employee.id,
            timeEntryId: activeEntryForBreakOut.id,
            updatedBy: user.id,
          });

          // Fetch updated entry with breaks
          result = await timeEntryService.getById(activeEntryForBreakOut.id);
          break;

        default:
          return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      console.error('Timesheet action error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['timesheet.own.read'], async (authRequest) => {
    try {
      const timeEntryService = getTimeEntryService();
      const user = authRequest.user!;

      // Get employee to get organization_id
      const employeeService = getEmployeeService();
      const employee = await employeeService.getByUserId(user.id);
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Get today's entries
      const todayEntries = await timeEntryService.getByEmployeeAndDateRange(
        employee.id,
        startOfDay,
        endOfDay
      );

      const activeEntry = await timeEntryService.getCurrentOpenEntry(employee.id);
      
      let activeBreak = null;
      if (activeEntry) {
        const breaks = await timeBreakService.getByTimeEntryId(activeEntry.id);
        activeBreak = breaks.find(breakItem => !breakItem.breakEndAt) || null;
      }

      return NextResponse.json({
        todayEntries: todayEntries || [],
        activeEntry,
        activeBreak,
        isClockedIn: !!activeEntry,
        isOnBreak: !!activeBreak,
      });
    } catch (error) {
      console.error('Timesheet status error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
