import { AccumulatedTimesheet } from '../service/timesheet-calculation.service';

/**
 * Interface for TimesheetCalculationService
 */
export interface ITimesheetCalculationService {
  /**
   * Calculate timesheet for a specific employee within a date range
   */
  calculateTimesheet(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccumulatedTimesheet>;
}
