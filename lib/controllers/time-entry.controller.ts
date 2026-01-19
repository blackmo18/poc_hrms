import { prisma } from '../db';
import { CreateTimeEntry, UpdateTimeEntry, TimeEntryFilters } from '../models/time-entry';
import { generateULID } from '../utils/ulid.service';

export class TimeEntryController {
  /**
   * Create a new time entry
   */
  async create(data: CreateTimeEntry) {
    const timeEntry = await prisma.timeEntry.create({
      data: {
        id: generateULID(),
        employee: { connect: { id: data.employeeId } },
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        workDate: data.workDate,
        clockInAt: data.clockInAt,
        clockOutAt: data.clockOutAt,
        status: data.status || 'OPEN',
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return timeEntry;
  }

  /**
   * Get time entry by ID
   */
  async getById(id: string) {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return timeEntry;
  }

  /**
   * Get time entries with filters and pagination
   */
  async getAll(filters: TimeEntryFilters, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.workDate) where.workDate = filters.workDate;
    if (filters.dateFrom && filters.dateTo) {
      where.workDate = {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      };
    } else if (filters.dateFrom) {
      where.workDate = { gte: filters.dateFrom };
    } else if (filters.dateTo) {
      where.workDate = { lte: filters.dateTo };
    }

    // Get total count
    const total = await prisma.timeEntry.count({ where });

    // Get paginated results
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { workDate: 'desc' },
        { clockInAt: 'desc' }
      ],
    });

    return {
      data: timeEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update time entry
   */
  async update(id: string, data: UpdateTimeEntry) {
    const updateData: any = {};
    
    if (data.clockOutAt !== undefined) updateData.clockOutAt = data.clockOutAt;
    if (data.totalWorkMinutes !== undefined) updateData.totalWorkMinutes = data.totalWorkMinutes;

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return timeEntry;
  }

  /**
   * Delete time entry
   */
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.timeEntry.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clock out - update clock_out_at and calculate total work minutes
   */
  async clockOut(id: string, clockOutAt: Date): Promise<any> {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!timeEntry) {
      throw new Error('Time entry not found');
    }

    // Calculate total work minutes
    const sessionMinutes = Math.floor((clockOutAt.getTime() - timeEntry.clockInAt.getTime()) / (1000 * 60));
    const totalWorkMinutes = Math.max(0, sessionMinutes);

    return this.update(id, {
      clockOutAt: clockOutAt,
      totalWorkMinutes: totalWorkMinutes,
    });
  }

  /**
   * Get time entries for an employee on a specific date
   */
  async getByEmployeeAndDate(employeeId: string, workDate: Date) {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId,
        workDate,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        clockInAt: 'asc',
      },
    });

    return timeEntries;
  }
}

export const timeEntryController = new TimeEntryController();
