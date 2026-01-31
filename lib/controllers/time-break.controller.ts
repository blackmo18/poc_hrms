import { prisma } from '../db';
import { CreateTimeBreak, UpdateTimeBreak, TimeBreakFilters } from '../models/time-break';
import { generateULID } from '../utils/ulid.service';

export class TimeBreakController {
  /**
   * Create a new time break
   */
  async create(data: CreateTimeBreak) {
    const id = generateULID();

    // Get the time entry to retrieve organizationId and employeeId
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: data.timeEntryId },
      select: { organizationId: true, employeeId: true },
    });

    if (!timeEntry) {
      throw new Error('TimeEntry not found');
    }

    const timeBreak = await prisma.timeBreak.create({
      data: {
        id,
        timeEntryId: data.timeEntryId,
        organizationId: timeEntry.organizationId,
        employeeId: timeEntry.employeeId,
        breakStartAt: data.breakStartAt,
        breakEndAt: data.breakEndAt,
        breakType: data.breakType || 'REST',
        isPaid: data.isPaid || false,
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

    if (filters.timeEntryId) where.timeEntryId = filters.timeEntryId;
    if (filters.breakType) where.breakType = filters.breakType;
    if (filters.isPaid !== undefined) where.isPaid = filters.isPaid;

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
    
    if (data.breakEndAt !== undefined) updateData.breakEndAt = data.breakEndAt;
    if (data.breakType !== undefined) updateData.breakType = data.breakType;
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;

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
      breakEndAt: endTime,
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
