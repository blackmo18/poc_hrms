import { PrismaClient, ScheduleType } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class WorkScheduleController {
  constructor(private prisma: PrismaClient) {}

  async getAll(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};
    
    return await this.prisma.workSchedule.findMany({
      where,
      include: {
        compensation: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getById(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const schedule = await this.prisma.workSchedule.findFirst({
      where,
      include: {
        compensation: {
          include: {
            employee: {
              include: {
                department: true,
                jobTitle: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new Error('Work schedule not found');
    }

    return schedule;
  }

  async create(data: {
    compensationId: string;
    organizationId: string;
    scheduleType?: ScheduleType;
    defaultStart?: string;
    defaultEnd?: string;
    workDays?: string[];
    restDays?: string[];
    overtimeRate?: number;
    restDayRate?: number;
    holidayRate?: number;
    specialHolidayRate?: number;
    doubleHolidayRate?: number;
    nightShiftStart?: string;
    nightShiftEnd?: string;
    nightDiffRate?: number;
    rotationPattern?: string;
    rotationStart?: Date;
    shiftGroups?: string[];
    officeDays?: string[];
    remoteDays?: string[];
    coreHoursStart?: string;
    coreHoursEnd?: string;
    totalHoursPerWeek?: number;
    isMonthlyRate?: boolean;
    monthlyRate?: number;
    dailyRate?: number;
    hourlyRate?: number;
    gracePeriodMinutes?: number;
    requiredWorkMinutes?: number;
    maxRegularHours?: number;
    maxOvertimeHours?: number;
    allowLateDeduction?: boolean;
    maxDeductionPerDay?: number;
    maxDeductionPerMonth?: number;
    isFlexibleSchedule?: boolean;
    minHoursPerDay?: number;
    maxHoursPerDay?: number;
    canLogAnyHours?: boolean;
  }) {
    // Verify compensation exists
    const compensation = await this.prisma.compensation.findUnique({
      where: { id: data.compensationId },
    });

    if (!compensation) {
      throw new Error('Compensation record not found');
    }

    // Check if work schedule already exists for this compensation
    const existing = await this.prisma.workSchedule.findUnique({
      where: { compensationId: data.compensationId },
    });

    if (existing) {
      throw new Error('Work schedule already exists for this compensation');
    }

    return await this.prisma.workSchedule.create({
      data: {
        id: generateULID(),
        compensationId: data.compensationId,
        organizationId: data.organizationId,
        scheduleType: data.scheduleType || 'FIXED',
        defaultStart: data.defaultStart,
        defaultEnd: data.defaultEnd,
        workDays: data.workDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        restDays: data.restDays || ['SATURDAY', 'SUNDAY'],
        overtimeRate: data.overtimeRate || 1.25,
        restDayRate: data.restDayRate || 1.30,
        holidayRate: data.holidayRate || 1.30,
        specialHolidayRate: data.specialHolidayRate || 1.30,
        doubleHolidayRate: data.doubleHolidayRate || 2.00,
        nightShiftStart: data.nightShiftStart || '22:00',
        nightShiftEnd: data.nightShiftEnd || '06:00',
        nightDiffRate: data.nightDiffRate || 0.10,
        rotationPattern: data.rotationPattern,
        rotationStart: data.rotationStart,
        shiftGroups: data.shiftGroups,
        officeDays: data.officeDays,
        remoteDays: data.remoteDays,
        coreHoursStart: data.coreHoursStart,
        coreHoursEnd: data.coreHoursEnd,
        totalHoursPerWeek: data.totalHoursPerWeek,
        isMonthlyRate: data.isMonthlyRate ?? true,
        monthlyRate: data.monthlyRate,
        dailyRate: data.dailyRate,
        hourlyRate: data.hourlyRate,
        gracePeriodMinutes: data.gracePeriodMinutes || 0,
        requiredWorkMinutes: data.requiredWorkMinutes || 480,
        maxRegularHours: data.maxRegularHours || 8,
        maxOvertimeHours: data.maxOvertimeHours || 3,
        allowLateDeduction: data.allowLateDeduction || false,
        maxDeductionPerDay: data.maxDeductionPerDay,
        maxDeductionPerMonth: data.maxDeductionPerMonth,
        isFlexibleSchedule: data.isFlexibleSchedule || false,
        minHoursPerDay: data.minHoursPerDay,
        maxHoursPerDay: data.maxHoursPerDay,
        canLogAnyHours: data.canLogAnyHours || false,
      },
      include: {
        compensation: {
          include: {
            employee: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<{
    scheduleType: ScheduleType;
    defaultStart: string;
    defaultEnd: string;
    workDays: string[];
    restDays: string[];
    overtimeRate: number;
    restDayRate: number;
    holidayRate: number;
    specialHolidayRate: number;
    doubleHolidayRate: number;
    nightShiftStart: string;
    nightShiftEnd: string;
    nightDiffRate: number;
    rotationPattern: string;
    rotationStart: Date;
    shiftGroups: string[];
    officeDays: string[];
    remoteDays: string[];
    coreHoursStart: string;
    coreHoursEnd: string;
    totalHoursPerWeek: number;
    isMonthlyRate: boolean;
    monthlyRate: number;
    dailyRate: number;
    hourlyRate: number;
    gracePeriodMinutes: number;
    requiredWorkMinutes: number;
    maxRegularHours: number;
    maxOvertimeHours: number;
    allowLateDeduction: boolean;
    maxDeductionPerDay: number;
    maxDeductionPerMonth: number;
    isFlexibleSchedule: boolean;
    minHoursPerDay: number;
    maxHoursPerDay: number;
    canLogAnyHours: boolean;
  }>) {
    const existing = await this.getById(id);

    return await this.prisma.workSchedule.update({
      where: { id },
      data,
      include: {
        compensation: {
          include: {
            employee: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const existing = await this.getById(id);

    return await this.prisma.workSchedule.delete({
      where: { id },
    });
  }

  async getByEmployeeId(employeeId: string) {
    return await this.prisma.workSchedule.findFirst({
      where: {
        compensation: {
          employeeId,
        },
      },
      include: {
        compensation: {
          include: {
            employee: {
              include: {
                department: true,
                jobTitle: true,
              },
            },
          },
        },
      },
    });
  }

  async getByOrganizationId(organizationId: string) {
    return await this.getAll(organizationId);
  }

  async bulkUpdate(updates: Array<{
    id: string;
    data: Partial<{
      scheduleType: ScheduleType;
      defaultStart: string;
      defaultEnd: string;
      workDays: string[];
      restDays: string[];
      gracePeriodMinutes: number;
      requiredWorkMinutes: number;
      allowLateDeduction: boolean;
    }>;
  }>) {
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const updated = await this.update(update.id, update.data);
        results.push(updated);
      } catch (error: any) {
        errors.push({
          id: update.id,
          error: error.message,
        });
      }
    }

    return {
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }
}
