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
    employeeId: string;
    timeEntryId: string;
    breakType?: BreakType;
    createdBy?: string;
  }): Promise<any> {
    try {
      // Validate required parameters
      if (!data.timeEntryId) {
        throw new Error('timeEntryId is required to start a break.');
      }

      // Get the time entry to validate
      const timeEntry = await timeEntryController.getById(data.timeEntryId);

      if (!timeEntry) {
        throw new Error('TimeEntry not found.');
      }

      if (timeEntry.employeeId !== data.employeeId) {
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
      const existingBreaks = await timeBreakController.getByTimeEntryId(data.timeEntryId);
      const ongoingBreak = existingBreaks.find(breakItem => !breakItem.breakEndAt);

      if (ongoingBreak) {
        throw new Error('There is already an ongoing break.');
      }

      // Create new break (using camelCase)
      const createData: CreateTimeBreak = {
        timeEntryId: data.timeEntryId,
        breakStartAt: currentTime,
        breakType: data.breakType || BreakType.REST,
        breakEndAt: undefined, // Not ended yet
        isPaid: false,
      };

      const newBreak = await timeBreakController.create(createData);
      console.log('Break created:', {
        id: newBreak.id,
        breakStartAt: newBreak.breakStartAt,
        breakEndAt: newBreak.breakEndAt,
        timeEntryId: newBreak.timeEntryId
      });

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
    employeeId: string;
    timeEntryId: string;
    updatedBy?: string;
  }): Promise<any> {
    try {
      // Validate required parameters
      if (!data.timeEntryId) {
        throw new Error('timeEntryId is required to end a break.');
      }

      // Get the time entry to validate
      const timeEntry = await timeEntryController.getById(data.timeEntryId);

      if (!timeEntry) {
        throw new Error('TimeEntry not found.');
      }

      if (timeEntry.employeeId !== data.employeeId) {
        throw new Error('TimeEntry does not belong to this employee.');
      }

      const currentTime = new Date();

      // Find ongoing break with better error handling
      const existingBreaks = await timeBreakController.getByTimeEntryId(data.timeEntryId);
      console.log(`Found ${existingBreaks.length} breaks for time entry ${data.timeEntryId}`);
      
      const ongoingBreak = existingBreaks.find(breakItem => !breakItem.breakEndAt);

      if (!ongoingBreak) {
        console.error('No ongoing break found. Breaks:', existingBreaks.map(b => ({
          id: b.id,
          breakStartAt: b.breakStartAt,
          breakEndAt: b.breakEndAt
        })));
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
