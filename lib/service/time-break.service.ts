import { timeBreakController } from '@/lib/controllers/time-break.controller';
import { timeEntryController } from '@/lib/controllers/time-entry.controller';
import { CreateTimeBreak } from '@/lib/models/time-break';
import { TimeEntryStatus } from '@/lib/models/time-entry';
import { BreakType } from '@prisma/client';
import { generateULID } from '../utils/ulid.service';
import { ITimeBreakService } from '@/lib/interfaces/time-break.interface';

export class TimeBreakService implements ITimeBreakService {
  /**
   * Start a break for an employee on a specific time entry
   */
  async startBreak(data: {
    employee_id: string;
    time_entry_id: string;
    break_type?: BreakType;
    created_by?: string;
  }): Promise<any> {
    try {
      // Get the time entry to validate
      const timeEntry = await timeEntryController.getById(data.time_entry_id);

      if (!timeEntry) {
        throw new Error('TimeEntry not found.');
      }

      if (timeEntry.employeeId !== data.employee_id) {
        throw new Error('TimeEntry does not belong to this employee.');
      }

      if (timeEntry.status !== TimeEntryStatus.OPEN) {
        throw new Error('Cannot start break. TimeEntry not found or not open.');
      }

      const currentTime = new Date();

      // Check break is within clock-in/out range
      if (currentTime < timeEntry.clockInAt || (timeEntry.clockOutAt && currentTime > timeEntry.clockOutAt)) {
        throw new Error('Break must be within clock-in/out range.');
      }

      // Check for ongoing break
      const existingBreaks = await timeBreakController.getByTimeEntryId(data.time_entry_id);
      const ongoingBreak = existingBreaks.find(breakItem => !breakItem.breakEndAt);

      if (ongoingBreak) {
        throw new Error('There is already an ongoing break.');
      }

      // Create new break
      const createData: CreateTimeBreak = {
        timesheet_id: data.time_entry_id,
        break_start_at: currentTime,
        break_type: data.break_type || BreakType.REST,
        break_end_at: undefined, // Not ended yet
        is_paid: false,
      };

      const newBreak = await timeBreakController.create(createData);

      return {
        success: true,
        message: 'Break started.',
        data: newBreak,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * End a break for an employee
   */
  async endBreak(data: {
    employee_id: string;
    time_entry_id: string;
    updated_by?: string;
  }): Promise<any> {
    try {
      // Get the time entry to validate
      const timeEntry = await timeEntryController.getById(data.time_entry_id);

      if (!timeEntry) {
        throw new Error('TimeEntry not found.');
      }

      if (timeEntry.employeeId !== data.employee_id) {
        throw new Error('TimeEntry does not belong to this employee.');
      }

      const currentTime = new Date();

      // Find ongoing break
      const existingBreaks = await timeBreakController.getByTimeEntryId(data.time_entry_id);
      const ongoingBreak = existingBreaks.find(breakItem => !breakItem.breakEndAt);

      if (!ongoingBreak) {
        throw new Error('No ongoing break to end.');
      }

      // Ensure end time is within clock-in/out range
      let endTime = currentTime;

      if (currentTime > (timeEntry.clockOutAt || currentTime)) {
        endTime = timeEntry.clockOutAt || currentTime;
      } else if (currentTime < timeEntry.clockInAt) {
        endTime = timeEntry.clockInAt;
      }

      // End the break
      const updatedBreak = await timeBreakController.endBreak(ongoingBreak.id, endTime);

      return {
        success: true,
        message: 'Break ended.',
        data: updatedBreak,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get time break by ID
   */
  async getById(id: string) {
    return await timeBreakController.getById(id);
  }

  /**
   * Get time breaks with filters
   */
  async getAll(filters: any): Promise<any[]> {
    return await timeBreakController.getAll(filters);
  }

  /**
   * Get breaks for a specific time entry
   */
  async getByTimeEntryId(timeEntryId: string): Promise<any[]> {
    return await timeBreakController.getByTimeEntryId(timeEntryId);
  }

  /**
   * Calculate total unpaid break minutes for a time entry
   */
  async getTotalUnpaidBreakMinutes(timeEntryId: string): Promise<number> {
    return await timeBreakController.getTotalUnpaidBreakMinutes(timeEntryId);
  }
}

export const timeBreakService = new TimeBreakService();
