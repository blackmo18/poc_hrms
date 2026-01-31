import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntryService } from '@/lib/service/time-entry.service';
import { getEmployeeService } from '@/lib/service/employee.service';
import { requiresPermissions } from '@/lib/auth/middleware';

const WORK_HOURS_PER_DAY = 8;
const NIGHT_SHIFT_START = 22; // 10 PM
const NIGHT_SHIFT_END = 6; // 6 AM

function calculateOTHours(totalMinutes: number): number {
  const totalHours = totalMinutes / 60;
  const otHours = Math.max(0, totalHours - WORK_HOURS_PER_DAY);
  return Math.round(otHours * 10) / 10;
}

function calculateNightDifferential(clockInAt: Date, clockOutAt: Date | null): number {
  if (!clockOutAt) return 0;

  let nightMinutes = 0;
  const current = new Date(clockInAt);

  while (current < clockOutAt) {
    const hour = current.getHours();
    
    // Night shift: 10 PM (22) to 6 AM (6)
    if (hour >= NIGHT_SHIFT_START || hour < NIGHT_SHIFT_END) {
      nightMinutes += 1;
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  const nightHours = nightMinutes / 60;
  return Math.round(nightHours * 10) / 10;
}

function calculateLates(clockInAt: Date): number {
  const expectedClockIn = new Date(clockInAt);
  expectedClockIn.setHours(8, 0, 0, 0); // Expected 8:00 AM

  const lateMinutes = Math.max(0, clockInAt.getTime() - expectedClockIn.getTime()) / (1000 * 60);
  const lateHours = lateMinutes / 60;
  return lateHours > 0 ? Math.round(lateHours * 10) / 10 : 0;
}

function determineEntryType(clockInAt: Date, lateHours: number, otHours: number): string {
  if (otHours > 0) return 'OT';
  if (lateHours > 0) return 'Late';
  return 'Regular';
}

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['timesheet.own.read'], async (authRequest) => {
    try {
      const user = authRequest.user!;
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Get employee to get organization_id
      const employeeService = getEmployeeService();
      const employee = await employeeService.getByUserId(user.id);
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      const timeEntryService = getTimeEntryService();

      // Parse dates or use default cutoff period
      let start: Date, end: Date;

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        // Default to current cutoff period
        const today = new Date();
        const currentDate = today.getDate();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        if (currentDate <= 15) {
          start = new Date(currentYear, currentMonth, 1);
          end = new Date(currentYear, currentMonth, 15);
        } else {
          start = new Date(currentYear, currentMonth, 16);
          end = new Date(currentYear, currentMonth + 1, 0);
        }
      }

      // Get time entries for the cutoff period
      const result = await timeEntryService.getByEmployeeAndDateRange(
        employee.id,
        start,
        new Date(end.getTime() + 86400000) // Add 1 day to include end date
      );

      // Calculate totals and stats
      const entries = result.data || [];
      let totalMinutes = 0;
      let totalOTHours = 0;
      let totalNightDifferential = 0;
      let totalLates = 0;

      const formattedEntries = entries.map(entry => {
        const otHours = calculateOTHours(entry.totalWorkMinutes || 0);
        const nightDiff = calculateNightDifferential(entry.clockInAt, entry.clockOutAt);
        const lateHours = calculateLates(entry.clockInAt);
        const entryType = determineEntryType(entry.clockInAt, lateHours, otHours);

        totalMinutes += entry.totalWorkMinutes || 0;
        totalOTHours += otHours;
        totalNightDifferential += nightDiff;
        totalLates += lateHours;

        return {
          id: entry.id,
          date: entry.workDate?.toISOString().split('T')[0] || new Date(entry.clockInAt).toISOString().split('T')[0],
          clockInAt: entry.clockInAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          clockOutAt: entry.clockOutAt ? entry.clockOutAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
          totalWorkMinutes: entry.totalWorkMinutes,
          status: entry.status,
          type: entryType,
          otHours,
          nightDifferential: nightDiff,
          lateHours,
        };
      });

      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      return NextResponse.json({
        success: true,
        data: {
          startDate: start,
          endDate: end,
          totalHours,
          targetHours: 88, // Default target, can be customized per organization
          stats: {
            otHours: Math.round(totalOTHours * 10) / 10,
            nightDifferential: Math.round(totalNightDifferential * 10) / 10,
            lates: Math.round(totalLates * 10) / 10,
          },
          entries: formattedEntries,
        },
      });
    } catch (error) {
      console.error('Cutoff data fetch error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
