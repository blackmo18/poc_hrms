import { timeEntryController } from '@/lib/controllers/time-entry.controller';
import { CreateTimeEntry, TimeEntryStatus } from '@/lib/models/time-entry';
import { TimeEntry } from '@prisma/client';
import { holidayService } from './holiday.service';
import { ITimeEntryService } from '@/lib/interfaces/time-entry.interface';
import { logInfo } from '../utils/logger';
import { createDateAtMidnightUTCFromDate } from '../utils/date-utils';
import { 
  convertManilaToUTC, 
  convertUTCToManila, 
  ensureUTCForStorage,
  createManilaMidnightUTC,
  getCurrentUTC
} from '../utils/timezone-utils';

export class TimeEntryService implements ITimeEntryService {
  /**
   * Clock in - create a new time entry with OPEN status
   */
  async clockIn(data: {
    employeeId: string;
    organizationId: string;
    clockInAt?: Date;
    workDate?: Date;
    createdBy?: string;
  }): Promise<TimeEntry> {
    // IMPORTANT: Always use current UTC time for clockInAt to prevent client manipulation
    // The time is stored in UTC but represents the moment the employee clocked in
    const clockInAt = getCurrentUTC();

    // Use provided workDate (from client, which knows local timezone) or calculate from server time
    // workDate should be stored as midnight UTC representing Manila midnight
    let workDate = data.workDate;
    if (!workDate) {
      // Create work date at midnight UTC from current Manila time
      const manilaTime = convertUTCToManila(clockInAt);
      workDate = createManilaMidnightUTC(
        `${manilaTime.getFullYear()}-${String(manilaTime.getMonth() + 1).padStart(2, '0')}-${String(manilaTime.getDate()).padStart(2, '0')}`
      );
    } else {
      // Convert the provided workDate to proper UTC format
      const workDateStr = workDate.toISOString().split('T')[0];
      workDate = createManilaMidnightUTC(workDateStr);
    }

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
    // Use provided time or current UTC time
    const clockOutTime = clockOutAt ? ensureUTCForStorage(clockOutAt) : getCurrentUTC();

    return await timeEntryController.clockOut(timeEntryId, clockOutTime!);
  }

  /**
   * Get time entries by organization and date range
   */
  async getTimeEntriesByOrganizationAndPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    status?: string
  ): Promise<TimeEntry[]> {
    return await timeEntryController.getByOrganizationAndPeriod(
      organizationId,
      periodStart,
      periodEnd,
      status
    );
  }

  /**
   * Get current open time entry for employee
   */
  async getCurrentOpenEntry(employeeId: string) {
    // Get current Manila date for filtering
    const manilaTime = convertUTCToManila(getCurrentUTC());
    const manilaStart = new Date(manilaTime.getFullYear(), manilaTime.getMonth(), manilaTime.getDate());
    const manilaEnd = new Date(manilaTime.getFullYear(), manilaTime.getMonth(), manilaTime.getDate() + 1);
    
    // Convert Manila date range to UTC for database query
    const utcStart = createManilaMidnightUTC(
      `${manilaStart.getFullYear()}-${String(manilaStart.getMonth() + 1).padStart(2, '0')}-${String(manilaStart.getDate()).padStart(2, '0')}`
    );
    const utcEnd = createManilaMidnightUTC(
      `${manilaEnd.getFullYear()}-${String(manilaEnd.getMonth() + 1).padStart(2, '0')}-${String(manilaEnd.getDate()).padStart(2, '0')}`
    );

    const result = await timeEntryController.getAll({
      employeeId: employeeId,
      status: TimeEntryStatus.OPEN,
      dateFrom: utcStart,
      dateTo: utcEnd,
    });

    // Return the most recent open entry (should only be one, but just in case)
    return result.data.length > 0 ? result.data[0] : null;
  }

  async isClockedIn(employeeId: string): Promise<boolean> {
    const currentEntry = await this.getCurrentOpenEntry(employeeId);
    return !!currentEntry;
  }

  async getById(id: string): Promise<TimeEntry | null> {
    return await timeEntryController.getById(id);
  }

  async getByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    const result = await timeEntryController.getAll({
      employeeId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    // const data = result.data.map(entry => {
    //   return ({
    //     entry.
    //   })
    // })
    logInfo('TIME_ENTRY', {
      employeeId,
      startDate,
      endDate,
      result
    })
    return result.data;
  }
}

export const timeEntryService = new TimeEntryService();

export function getTimeEntryService(): ITimeEntryService {
  return timeEntryService;
}
