import { getTimesheetCalculationService, AccumulatedTimesheet } from '@/lib/service/timesheet-calculation.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class TimesheetCalculationController {
  private timesheetCalculationService = getTimesheetCalculationService();

  /**
   * Calculate timesheet for an employee within a date range
   */
  async calculateTimesheet(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccumulatedTimesheet> {
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    return await this.timesheetCalculationService.calculateTimesheet(employeeId, startDate, endDate);
  }

  /**
   * Calculate timesheet for multiple employees within a date range
   */
  async calculateTimesheetsForEmployees(
    employeeIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<AccumulatedTimesheet[]> {
    if (!employeeIds || employeeIds.length === 0) {
      throw new Error('At least one employee ID is required');
    }

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    const results: AccumulatedTimesheet[] = [];

    for (const employeeId of employeeIds) {
      try {
        const result = await this.timesheetCalculationService.calculateTimesheet(employeeId, startDate, endDate);
        results.push(result);
      } catch (error) {
        console.error(`Failed to calculate timesheet for employee ${employeeId}:`, error);
        // Continue with other employees instead of failing the entire batch
      }
    }

    return results;
  }

  /**
   * Calculate timesheet for all employees in an organization within a date range
   */
  async calculateTimesheetsForOrganization(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccumulatedTimesheet[]> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    // TODO: Get all active employees for the organization
    // For now, we'll need to implement this when we have the employee controller
    // This is a placeholder that will be implemented once we have employee listing
    throw new Error('calculateTimesheetsForOrganization not yet implemented - requires employee listing');

    // Future implementation:
    // const employees = await employeeController.getAll({ organizationId: organizationId, is_active: true });
    // const employeeIds = employees.map(emp => emp.id);
    // return await this.calculateTimesheetsForEmployees(employeeIds, startDate, endDate);
  }
}

let timesheetCalculationController: TimesheetCalculationController;

export function getTimesheetCalculationController(): TimesheetCalculationController {
  if (!timesheetCalculationController) {
    timesheetCalculationController = new TimesheetCalculationController();
  }
  return timesheetCalculationController;
}
