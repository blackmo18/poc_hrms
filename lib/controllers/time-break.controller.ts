import { prisma } from '../db';
import { CreateTimeBreak, UpdateTimeBreak, TimeBreakFilters } from '../models/time-break';
import { generateULID } from '../utils/ulid.service';

export class TimeBreakController {
  /**
   * Create a new time break
   */
  async create(data: CreateTimeBreak) {
    const id = generateULID();

    const timeBreak = await prisma.timeBreak.create({
      data: {
        id,
        timeEntryId: data.timesheet_id,
        breakStartAt: data.break_start_at,
        breakEndAt: data.break_end_at,
        breakType: data.break_type || 'REST',
        isPaid: data.is_paid || false,
      } as any,
      include: {
        timeEntry: {
          select: {
            id: true,
            employeeId: true,
            workDate: true,
          },
        },
      },
    });

    return timeBreak;
  }

  /**
   * Get time break by ID
   */
  async getById(id: string) {
    const timeBreak = await prisma.timeBreak.findUnique({
      where: { id },
      include: {
        timeEntry: {
          select: {
            id: true,
            employeeId: true,
            workDate: true,
          },
        },
      },
    });

    return timeBreak;
  }

  /**
   * Get time breaks with filters
   */
  async getAll(filters: TimeBreakFilters) {
    const where: any = {};

    if (filters.timesheet_id) where.timeEntryId = filters.timesheet_id;
    if (filters.break_type) where.breakType = filters.break_type;
    if (filters.is_paid !== undefined) where.isPaid = filters.is_paid;

    const timeBreaks = await prisma.timeBreak.findMany({
      where,
      include: {
        timeEntry: {
          select: {
            id: true,
            employeeId: true,
            workDate: true,
          },
        },
      },
      orderBy: {
        breakStartAt: 'asc',
      },
    });

    return timeBreaks;
  }

  /**
   * Get breaks for a specific time entry
   */
  async getByTimeEntryId(timeEntryId: string) {
    const timeBreaks = await prisma.timeBreak.findMany({
      where: {
        timeEntryId: timeEntryId,
      },
      include: {
        timeEntry: {
          select: {
            id: true,
            employeeId: true,
            workDate: true,
          },
        },
      },
      orderBy: {
        breakStartAt: 'asc',
      },
    });

    return timeBreaks;
  }

  /**
   * Update time break
   */
  async update(id: string, data: UpdateTimeBreak) {
    const updateData: any = {};
    
    if (data.break_end_at !== undefined) updateData.breakEndAt = data.break_end_at;
    if (data.break_type !== undefined) updateData.breakType = data.break_type;
    if (data.is_paid !== undefined) updateData.isPaid = data.is_paid;

    const timeBreak = await prisma.timeBreak.update({
      where: { id },
      data: updateData,
      include: {
        timeEntry: {
          select: {
            id: true,
            employeeId: true,
            workDate: true,
          },
        },
      },
    });

    return timeBreak;
  }

  /**
   * Delete time break
   */
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.timeBreak.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * End break - update breakEndAt
   */
  async endBreak(id: string, endTime: Date) {
    return this.update(id, {
      break_end_at: endTime,
    });
  }

  /**
   * Calculate total break duration in minutes
   */
  calculateBreakDuration(breakStart: Date, breakEnd?: Date | null): number {
    if (!breakEnd) return 0;
    return Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
  }

  /**
   * Get total unpaid break minutes for a time entry
   */
  async getTotalUnpaidBreakMinutes(timeEntryId: string): Promise<number> {
    const breaks = await this.getByTimeEntryId(timeEntryId);

    return breaks
      .filter(breakItem => !breakItem.isPaid && breakItem.breakEndAt)
      .reduce((total, breakItem) => {
        return total + this.calculateBreakDuration(breakItem.breakStartAt, breakItem.breakEndAt);
      }, 0);
  }
}

export const timeBreakController = new TimeBreakController();
