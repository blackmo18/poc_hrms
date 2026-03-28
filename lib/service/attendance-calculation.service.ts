import { timeEntryService } from './time-entry.service';
import { getLeaveRequestService } from './leave-request.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { AttendanceStatus, LeaveDay, AttendanceCalculationOptions, PayrollEligibilityResult } from '../types/attendance.types';
import { DIContainer } from '../di/container';
import { logInfo } from '../utils/logger';

function getDIContainer() {
  return DIContainer.getInstance();
}

let payrollCalculationService: PayrollCalculationService;
function getPayrollCalculationService(): PayrollCalculationService {
  if (!payrollCalculationService) {
    try {
      payrollCalculationService = getDIContainer().getPayrollCalculationService();
    } catch (error) {
      // Fallback for testing or when DI container is not available
      payrollCalculationService = new PayrollCalculationService({} as any);
    }
  }
  return payrollCalculationService;
}

export class AttendanceCalculationService {
  private get payrollCalculationService(): PayrollCalculationService {
    return getPayrollCalculationService();
  }

  /**
   * Calculate comprehensive attendance status for an employee
   */
  async calculateAttendanceStatus(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    options: AttendanceCalculationOptions = {}
  ): Promise<AttendanceStatus> {
    const {
      includeWeekends = false,
      excludeHolidays = true,
      considerLeaveAsPresent = true
    } = options;

    logInfo('ATTENDANCE_CALCULATION', {
      employeeId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      options
    });

    // Get time entries for the period
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    );

    // Get approved leave for the period
    const leaveRequestService = getLeaveRequestService();
    const approvedLeaves = await leaveRequestService.getApprovedLeaveByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    ) || [];

    // Calculate actual absent days using existing service
    const actualAbsentDays = await this.payrollCalculationService.calculateActualAbsentDays(
      employeeId,
      periodStart,
      periodEnd
    );

    // Process leave details
    const leaveDetails: LeaveDay[] = approvedLeaves.map(leave => ({
      date: leave.startDate,
      leaveType: leave.leaveType,
      isPaid: leave.isPaid || false, // Default to unpaid if not specified
      approvedAt: leave.updatedAt || new Date() // Use updatedAt as approvedAt proxy
    }));

    // Determine payroll eligibility
    const hasTimeEntries = timeEntries.length > 0;
    const hasApprovedLeave = approvedLeaves.length > 0;
    const payrollEligible = hasTimeEntries || (hasApprovedLeave && considerLeaveAsPresent);

    const attendanceStatus: AttendanceStatus = {
      hasTimeEntries,
      hasApprovedLeave,
      presentDays: timeEntries.length,
      absentDays: actualAbsentDays,
      leaveDays: approvedLeaves.length,
      payrollEligible,
      leaveDetails
    };

    logInfo('ATTENDANCE_CALCULATION_RESULT', {
      employeeId,
      attendanceStatus
    });

    return attendanceStatus;
  }

  /**
   * Check if employee has any work activity during the period
   */
  async hasWorkActivity(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<boolean> {
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    );
    return timeEntries.length > 0;
  }

  /**
   * Check if employee has approved leave during the period
   */
  async hasApprovedLeave(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<boolean> {
    const leaveRequestService = getLeaveRequestService();
    const approvedLeaves = await leaveRequestService.getApprovedLeaveByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    );
    return approvedLeaves.length > 0;
  }

  /**
   * Get all leave days for an employee during a period
   */
  async getLeaveDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<LeaveDay[]> {
    const leaveRequestService = getLeaveRequestService();
    const approvedLeaves = await leaveRequestService.getApprovedLeaveByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    ) || [];

    return approvedLeaves.map(leave => ({
      date: leave.startDate,
      leaveType: leave.leaveType,
      isPaid: leave.isPaid || false,
      approvedAt: leave.updatedAt || new Date() // Use updatedAt as approvedAt proxy
    }));
  }

  /**
   * Determine payroll eligibility based on attendance and leave
   */
  async determinePayrollEligibility(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    options: AttendanceCalculationOptions = {}
  ): Promise<PayrollEligibilityResult> {
    const attendanceStatus = await this.calculateAttendanceStatus(
      employeeId,
      periodStart,
      periodEnd,
      options
    );

    let eligible = true;
    let reason: string | undefined;

    if (!attendanceStatus.hasTimeEntries && !attendanceStatus.hasApprovedLeave) {
      eligible = false;
      reason = 'No time entries and no approved leave during period';
    } else if (!attendanceStatus.payrollEligible) {
      eligible = false;
      reason = 'Not eligible for payroll based on attendance and leave status';
    }

    return {
      eligible,
      reason,
      attendanceStatus
    };
  }
}

// Export singleton instance
let attendanceCalculationService: AttendanceCalculationService;
export function getAttendanceCalculationService(): AttendanceCalculationService {
  if (!attendanceCalculationService) {
    attendanceCalculationService = new AttendanceCalculationService();
  }
  return attendanceCalculationService;
}
