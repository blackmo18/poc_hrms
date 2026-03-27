export interface TimeManagementStats {
  totalEmployees: number;
  activeToday: number;
  onTimeToday: number;
  lateToday: number;
  totalHoursToday: number;
  overtimeHoursToday: number;
  pendingCorrections: number;
  nightShiftActive: number;
  weeklyAttendance: number;
  monthlyOvertime: number;
  breakCompliance: number;
  timesheetSubmitted: number;
  timesheetPending: number;
}

export interface RecentActivity {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'correction' | 'overtime';
  employee: string;
  time: string;
  status: 'normal' | 'late' | 'early' | 'overtime' | 'warning';
  description: string;
}

export interface AttendanceAlert {
  id: string;
  type: 'late_arrival' | 'early_departure' | 'missing_break' | 'excessive_overtime';
  employee: string;
  department: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
}
