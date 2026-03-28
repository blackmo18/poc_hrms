export interface AttendanceStatus {
  hasTimeEntries: boolean;
  hasApprovedLeave: boolean;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  payrollEligible: boolean;
  leaveDetails: LeaveDay[];
}

export interface LeaveDay {
  date: Date;
  leaveType: string;
  isPaid: boolean;
  approvedAt: Date;
}

export interface AttendanceCalculationOptions {
  includeWeekends?: boolean;
  excludeHolidays?: boolean;
  considerLeaveAsPresent?: boolean;
}

export interface PayrollEligibilityResult {
  eligible: boolean;
  reason?: string;
  attendanceStatus: AttendanceStatus;
}
