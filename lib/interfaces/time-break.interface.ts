import { TimeBreak } from '@prisma/client';
import { BreakType } from '@prisma/client';

/**
 * Interface for TimeBreakService
 */
export interface ITimeBreakService {
  /**
   * Start a break for an employee on a specific time entry
   */
  startBreak(data: {
    employee_id: string;
    time_entry_id: string;
    break_type?: BreakType;
    created_by?: string;
  }): Promise<any>;

  /**
   * End a break for an employee
   */
  endBreak(data: {
    employee_id: string;
    time_entry_id: string;
    updated_by?: string;
  }): Promise<any>;

  /**
   * Get time break by ID
   */
  getById(id: string): Promise<any>;

  /**
   * Get time breaks with filters
   */
  getAll(filters: any): Promise<any[]>;

  /**
   * Get breaks for a specific time entry
   */
  getByTimeEntryId(timeEntryId: string): Promise<any[]>;

  /**
   * Calculate total unpaid break minutes for a time entry
   */
  getTotalUnpaidBreakMinutes(timeEntryId: string): Promise<number>;
}
