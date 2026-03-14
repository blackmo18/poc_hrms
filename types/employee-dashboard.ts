export interface EmployeeTimeStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  overtimeHours: number;
  remainingLeave: number;
  pendingRequests: number;
  todayStatus: 'not_clocked_in' | 'clocked_in' | 'on_break' | 'clocked_out';
  clockInTime?: string;
  breakTime?: string;
  lastClockOut?: string;
  onTimeEntries: number;
  lateArrivals: number;
}

export interface RecentActivity {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  date: string;
  time: string;
  description: string;
}

export interface LeaveRequest {
  id: string;
  type: 'annual' | 'sick' | 'personal';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  days: number;
}

export interface OvertimeRequest {
  id: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}
