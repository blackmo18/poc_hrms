import { TimeEntry } from '@prisma/client';

/**
 * Interface for TimeEntryService
 */
export interface ITimeEntryService {
  /**
   * Clock in - create a new time entry with OPEN status
   */
  clockIn(data: {
    employee_id: string;
    organizationId: string;
    clock_in_at?: Date;
    created_by?: string;
  }): Promise<TimeEntry>;

  /**
   * Clock out from a time entry
   */
  clockOut(timeEntryId: string, clockOutAt?: Date, updatedBy?: string): Promise<any>;

  /**
   * Get current open time entry for employee
   */
  getCurrentOpenEntry(employeeId: string): Promise<any>;

  /**
   * Check if employee is currently clocked in
   */
  isClockedIn(employeeId: string): Promise<boolean>;

  /**
   * Get time entry by ID
   */
  getById(id: string): Promise<any>;

  /**
   * Get time entries for employee within date range
   */
  getByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<any>;
}
