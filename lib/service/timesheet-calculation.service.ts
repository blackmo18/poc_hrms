import { timeEntryController } from '@/lib/controllers/time-entry.controller';
import { timeBreakController } from '@/lib/controllers/time-break.controller';
import { overtimeRequestController } from '@/lib/controllers/overtime-request.controller';
import { TimeEntryWithRelations } from '@/lib/models/time-entry';
import { TimeBreakWithRelations } from '@/lib/models/time-break';
import { OvertimeRequestWithRelations } from '@/lib/models/overtime-request';
import { OvertimeRequestStatus } from '@/lib/models/overtime-request';
import { ITimesheetCalculationService } from '@/lib/interfaces/timesheet-calculation.interface';

export interface TimesheetCalculationResult {
  employeeId: string;
  work_date: Date;
  raw_minutes: number;
  paid_break_minutes: number;
  unpaid_break_minutes: number;
  net_work_minutes: number;
  regular_minutes: number;
  overtime_raw_minutes: number;
  overtime_approved_minutes: number;
  payable_minutes: number;
}

export interface AccumulatedTimesheet {
  employeeId: string;
  period_start: Date;
  period_end: Date;
  total_raw_minutes: number;
  total_paid_break_minutes: number;
  total_unpaid_break_minutes: number;
  total_net_work_minutes: number;
  total_regular_minutes: number;
  total_overtime_raw_minutes: number;
  total_overtime_approved_minutes: number;
  total_payable_minutes: number;
  entries: TimesheetCalculationResult[];
}

export class TimesheetCalculationService implements ITimesheetCalculationService {
  /**
   * Calculate timesheet for a specific employee within a date range
   */
  async calculateTimesheet(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccumulatedTimesheet> {
    // Get all time entries for the employee within the date range
    const timeEntries = await this.getTimeEntriesForEmployee(employeeId, startDate, endDate);

    const results: TimesheetCalculationResult[] = [];
    let totalRaw = 0;
    let totalPaidBreaks = 0;
    let totalUnpaidBreaks = 0;
    let totalNetWork = 0;
    let totalRegular = 0;
    let totalOvertimeRaw = 0;
    let totalOvertimeApproved = 0;
    let totalPayable = 0;

    for (const timeEntry of timeEntries) {
      const result = await this.calculateTimeEntry(timeEntry);
      results.push(result);

      // Accumulate totals
      totalRaw += result.raw_minutes;
      totalPaidBreaks += result.paid_break_minutes;
      totalUnpaidBreaks += result.unpaid_break_minutes;
      totalNetWork += result.net_work_minutes;
      totalRegular += result.regular_minutes;
      totalOvertimeRaw += result.overtime_raw_minutes;
      totalOvertimeApproved += result.overtime_approved_minutes;
      totalPayable += result.payable_minutes;
    }

    return {
      employeeId: employeeId,
      period_start: startDate,
      period_end: endDate,
      total_raw_minutes: totalRaw,
      total_paid_break_minutes: totalPaidBreaks,
      total_unpaid_break_minutes: totalUnpaidBreaks,
      total_net_work_minutes: totalNetWork,
      total_regular_minutes: totalRegular,
      total_overtime_raw_minutes: totalOvertimeRaw,
      total_overtime_approved_minutes: totalOvertimeApproved,
      total_payable_minutes: totalPayable,
      entries: results,
    };
  }

  /**
   * Calculate individual time entry based on the algorithm
   */
  private async calculateTimeEntry(timeEntry: TimeEntryWithRelations): Promise<TimesheetCalculationResult> {
    if (!timeEntry.clockOutAt) {
      throw new Error(`Time entry ${timeEntry.id} is not closed (missing clockOutAt)`);
    }

    // Calculate raw minutes from clockOut - clockIn
    const raw = Math.floor((timeEntry.clockOutAt.getTime() - timeEntry.clockInAt.getTime()) / (1000 * 60));

    // Get breaks for this time entry
    const breaks = await this.getBreaksForTimeEntry(timeEntry.id);

    let paidBreaks = 0;
    let unpaidBreaks = 0;

    // Calculate break minutes
    for (const breakItem of breaks) {
      if (!breakItem.breakEndAt) continue; // Skip unfinished breaks

      const breakMinutes = Math.floor((breakItem.breakEndAt.getTime() - breakItem.breakStartAt.getTime()) / (1000 * 60));

      if (breakItem.isPaid) {
        paidBreaks += breakMinutes;
      } else {
        unpaidBreaks += breakMinutes;
      }
    }

    // Calculate net work time = raw - unpaid breaks
    const netWork = raw - unpaidBreaks;

    // Calculate regular time = min(netWork, 480 minutes = 8 hours)
    const regular = Math.min(netWork, 480);

    // Calculate overtime raw = max(netWork - 480, 0)
    const overtimeRaw = Math.max(netWork - 480, 0);

    // Get approved overtime for this employee and work date
    const approvedOT = await this.fetchApprovedOT(timeEntry.employeeId, timeEntry.workDate);

    // Calculate approved overtime = min(overtimeRaw, approvedOT)
    const overtimeApproved = Math.min(overtimeRaw, approvedOT);

    // Calculate payable = regular + overtimeApproved + paidBreaks
    const payable = regular + overtimeApproved + paidBreaks;

    return {
      employeeId: timeEntry.employeeId,
      work_date: timeEntry.workDate,
      raw_minutes: raw,
      paid_break_minutes: paidBreaks,
      unpaid_break_minutes: unpaidBreaks,
      net_work_minutes: netWork,
      regular_minutes: regular,
      overtime_raw_minutes: overtimeRaw,
      overtime_approved_minutes: overtimeApproved,
      payable_minutes: payable,
    };
  }

  /**
   * Fetch approved overtime minutes for an employee on a specific date
   */
  private async fetchApprovedOT(employeeId: string, workDate: Date): Promise<number> {
    try {
      const result = await overtimeRequestController.getAll({
        employeeId: employeeId,
        work_date: workDate,
        status: OvertimeRequestStatus.APPROVED,
      });

      // Sum up all approved overtime minutes for this date
      return result.data.reduce((total, request) => {
        return total + (request.approvedMinutes || 0);
      }, 0);
    } catch (error) {
      console.warn(`Failed to fetch approved overtime for employee ${employeeId} on ${workDate}:`, error);
      return 0; // Return 0 if unable to fetch approved OT
    }
  }

  /**
   * Get all time entries for an employee within a date range
   */
  private async getTimeEntriesForEmployee(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeEntryWithRelations[]> {
    const result = await timeEntryController.getAll({
      employeeId: employeeId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    // Filter out entries that are not closed (still open)
    return result.data.filter(entry => entry.status === 'CLOSED') as TimeEntryWithRelations[];
  }

  /**
   * Get all breaks for a time entry
   */
  private async getBreaksForTimeEntry(timeEntryId: string): Promise<TimeBreakWithRelations[]> {
    return await timeBreakController.getAll({
      timesheet_id: timeEntryId,
    });
  }
}

let timesheetCalculationService: ITimesheetCalculationService;

export function getTimesheetCalculationService(): ITimesheetCalculationService {
  if (!timesheetCalculationService) {
    timesheetCalculationService = new TimesheetCalculationService();
  }
  return timesheetCalculationService;
}
