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
    employeeId: string;
    timeEntryId: string;
    breakType?: BreakType;
    createdBy?: string;
  }): Promise<any>;

  /**
   * End a break for an employee
   */
  endBreak(data: {
    employeeId: string;
    timeEntryId: string;
    updatedBy?: string;
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
