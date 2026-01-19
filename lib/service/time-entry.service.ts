import { timeEntryController } from '@/lib/controllers/time-entry.controller';
import { CreateTimeEntry, TimeEntryStatus } from '@/lib/models/time-entry';
import { TimeEntry } from '@prisma/client';
import { holidayService } from './holiday.service';
import { ITimeEntryService } from '@/lib/interfaces/time-entry.interface';

export class TimeEntryService implements ITimeEntryService {
  /**
   * Clock in - create a new time entry with OPEN status
   */
  async clockIn(data: {
    employeeId: string;
    organizationId: string;
    clockInAt?: Date;
    createdBy?: string;
  }): Promise<TimeEntry> {
    const clockInAt = data.clockInAt || new Date();
    
    // Create work date in local timezone to avoid timezone issues
    const workDate = new Date(clockInAt.getFullYear(), clockInAt.getMonth(), clockInAt.getDate());

    const createData: CreateTimeEntry = {
      employeeId: data.employeeId,
      organizationId: data.organizationId,
      clockInAt: clockInAt,
      workDate: workDate,
      status: TimeEntryStatus.OPEN,
    };

    return await timeEntryController.create(createData);
  }

  async clockOut(timeEntryId: string, clockOutAt?: Date, updatedBy?: string) {
    const clockOutTime = clockOutAt || new Date();

    return await timeEntryController.clockOut(timeEntryId, clockOutTime);
  }

  /**
   * Get current open time entry for employee
   */
  async getCurrentOpenEntry(employeeId: string) {
    // Get today's date at start of day in local timezone
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const result = await timeEntryController.getAll({
      employeeId: employeeId,
      status: TimeEntryStatus.OPEN,
      dateFrom: todayStart,
      dateTo: todayEnd,
    });

    // Return the most recent open entry (should only be one, but just in case)
    return result.data.length > 0 ? result.data[0] : null;
  }

  /**
   * Check if employee is currently clocked in
   */
  async isClockedIn(employeeId: string): Promise<boolean> {
    const currentEntry = await this.getCurrentOpenEntry(employeeId);
    return currentEntry !== null;
  }

  /**
   * Get time entry by ID
   */
  async getById(id: string) {
    return await timeEntryController.getById(id);
  }

  /**
   * Get time entries for employee within date range
   */
  async getByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date) {
    return await timeEntryController.getAll({
      employeeId: employeeId,
      dateFrom: startDate,
      dateTo: endDate,
    });
  }
}

let timeEntryService: ITimeEntryService;

export function getTimeEntryService(): ITimeEntryService {
  if (!timeEntryService) {
    timeEntryService = new TimeEntryService();
  }
  return timeEntryService;
}
