import { WorkScheduleController } from '@/lib/controllers';
import { ScheduleType } from '@prisma/client';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateWorkSchedule {
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
}

export interface UpdateWorkSchedule {
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
}

export class WorkScheduleService {
  constructor(private controller: WorkScheduleController) {}

  async getById(id: string, organizationId?: string) {
    return await this.controller.getById(id, organizationId);
  }

  async getAll(organizationId?: string, options?: PaginationOptions): Promise<PaginatedResponse<any>> {
    const result = await this.controller.getAll(organizationId);
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: CreateWorkSchedule) {
    // Validation
    this.validateScheduleData(data);

    // Additional validation for schedule type specific requirements
    this.validateScheduleType(data);

    return await this.controller.create(data);
  }

  async update(id: string, data: UpdateWorkSchedule) {
    // Validation
    if (data.scheduleType) {
      this.validateScheduleType({ ...data, scheduleType: data.scheduleType });
    }

    return await this.controller.update(id, data);
  }

  async delete(id: string) {
    return await this.controller.delete(id);
  }

  async getByEmployeeId(employeeId: string) {
    return await this.controller.getByEmployeeId(employeeId);
  }

  async getByOrganizationId(organizationId: string) {
    return await this.controller.getByOrganizationId(organizationId);
  }

  async bulkUpdate(updates: Array<{
    id: string;
    data: Partial<UpdateWorkSchedule>;
  }>) {
    // Validate all updates
    for (const update of updates) {
      if (update.data.scheduleType) {
        this.validateScheduleType(update.data as any);
      }
    }

    return await this.controller.bulkUpdate(updates);
  }

  async calculateDailyRate(schedule: any, monthlySalary: number): Promise<number> {
    if (schedule.dailyRate) {
      return schedule.dailyRate;
    }

    // Philippine labor code: Daily rate = Monthly rate × 12 ÷ 313
    // 313 is the average number of working days in a year
    const dailyRate = (monthlySalary * 12) / 313;
    return Math.round(dailyRate * 100) / 100;
  }

  async calculateHourlyRate(schedule: any, monthlySalary: number): Promise<number> {
    if (schedule.hourlyRate) {
      return schedule.hourlyRate;
    }

    const dailyRate = await this.calculateDailyRate(schedule, monthlySalary);
    const hourlyRate = dailyRate / 8; // Standard 8-hour workday
    return Math.round(hourlyRate * 100) / 100;
  }

  async isNightShift(time: string, schedule: any): Promise<boolean> {
    const [hours, minutes] = time.split(':').map(Number);
    const timeMinutes = hours * 60 + minutes;
    
    const [startHours, startMinutes] = schedule.nightShiftStart?.split(':').map(Number) || [22, 0];
    const [endHours, endMinutes] = schedule.nightShiftEnd?.split(':').map(Number) || [6, 0];
    
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    if (startMinutesTotal > endMinutesTotal) {
      // Night shift spans midnight (e.g., 22:00 to 06:00)
      return timeMinutes >= startMinutesTotal || timeMinutes < endMinutesTotal;
    } else {
      // Night shift within same day
      return timeMinutes >= startMinutesTotal && timeMinutes < endMinutesTotal;
    }
  }

  async calculateNightDifferentialMinutes(
    clockIn: Date,
    clockOut: Date,
    schedule: any
  ): Promise<number> {
    let nightMinutes = 0;
    let current = new Date(clockIn);

    while (current < clockOut) {
      const timeStr = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
      
      if (await this.isNightShift(timeStr, schedule)) {
        nightMinutes++;
      }

      current.setMinutes(current.getMinutes() + 1);
    }

    return nightMinutes;
  }

  async getWorkDaysForPeriod(
    schedule: any,
    startDate: Date,
    endDate: Date
  ): Promise<Date[]> {
    const workDays: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      
      if (schedule.workDays.includes(dayName)) {
        workDays.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    return workDays;
  }

  async validateTimeEntry(
    schedule: any,
    clockIn: Date,
    clockOut: Date
  ): Promise<{
    isValid: boolean;
    violations: string[];
    lateMinutes: number;
    undertimeMinutes: number;
  }> {
    const violations: string[] = [];
    let lateMinutes = 0;
    let undertimeMinutes = 0;

    // Check if it's a work day
    const dayName = clockIn.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    if (!schedule.workDays.includes(dayName)) {
      violations.push('Time entry is on a non-working day');
    }

    // Check clock-in time
    if (schedule.defaultStart) {
      const [startHours, startMinutes] = schedule.defaultStart.split(':').map(Number);
      const scheduledStart = new Date(clockIn);
      scheduledStart.setHours(startHours, startMinutes, 0, 0);

      if (clockIn > scheduledStart) {
        lateMinutes = Math.floor((clockIn.getTime() - scheduledStart.getTime()) / (1000 * 60));
        
        // Apply grace period
        if (lateMinutes > (schedule.gracePeriodMinutes || 0)) {
          violations.push(`Late by ${lateMinutes} minutes`);
        }
      }
    }

    // Check clock-out time
    if (schedule.defaultEnd) {
      const [endHours, endMinutes] = schedule.defaultEnd.split(':').map(Number);
      const scheduledEnd = new Date(clockOut);
      scheduledEnd.setHours(endHours, endMinutes, 0, 0);

      if (clockOut < scheduledEnd) {
        undertimeMinutes = Math.floor((scheduledEnd.getTime() - clockOut.getTime()) / (1000 * 60));
        violations.push(`Undertime by ${undertimeMinutes} minutes`);
      }
    }

    // Check minimum hours for flexible schedules
    if (schedule.isFlexibleSchedule && schedule.minHoursPerDay) {
      const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
      const requiredMinutes = schedule.minHoursPerDay * 60;
      
      if (totalMinutes < requiredMinutes) {
        violations.push(`Work hours below minimum required: ${requiredMinutes / 60} hours`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      lateMinutes: Math.max(0, lateMinutes - (schedule.gracePeriodMinutes || 0)),
      undertimeMinutes,
    };
  }

  private validateScheduleData(data: CreateWorkSchedule) {
    // Validate required fields
    if (!data.compensationId) {
      throw new Error('Compensation ID is required');
    }

    if (!data.organizationId) {
      throw new Error('Organization ID is required');
    }

    // Validate time formats
    if (data.defaultStart && !this.isValidTimeFormat(data.defaultStart)) {
      throw new Error('Invalid default start time format. Use HH:MM');
    }

    if (data.defaultEnd && !this.isValidTimeFormat(data.defaultEnd)) {
      throw new Error('Invalid default end time format. Use HH:MM');
    }

    // Validate work days and rest days
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    if (data.workDays && data.workDays.some(day => !validDays.includes(day))) {
      throw new Error('Invalid work days provided');
    }

    if (data.restDays && data.restDays.some(day => !validDays.includes(day))) {
      throw new Error('Invalid rest days provided');
    }

    // Validate rates
    if (data.overtimeRate && data.overtimeRate <= 0) {
      throw new Error('Overtime rate must be greater than 0');
    }

    if (data.restDayRate && data.restDayRate <= 0) {
      throw new Error('Rest day rate must be greater than 0');
    }

    if (data.holidayRate && data.holidayRate <= 0) {
      throw new Error('Holiday rate must be greater than 0');
    }

    // Validate hours
    if (data.requiredWorkMinutes && data.requiredWorkMinutes <= 0) {
      throw new Error('Required work minutes must be greater than 0');
    }

    if (data.maxRegularHours && data.maxRegularHours <= 0) {
      throw new Error('Max regular hours must be greater than 0');
    }
  }

  private validateScheduleType(data: any) {
    switch (data.scheduleType) {
      case 'FIXED':
        if (!data.defaultStart || !data.defaultEnd) {
          throw new Error('Fixed schedule requires default start and end times');
        }
        break;

      case 'FLEXIBLE':
        if (!data.coreHoursStart || !data.coreHoursEnd) {
          throw new Error('Flexible schedule requires core hours start and end times');
        }
        if (!data.totalHoursPerWeek) {
          throw new Error('Flexible schedule requires total hours per week');
        }
        break;

      case 'ROTATING':
        if (!data.rotationPattern) {
          throw new Error('Rotating schedule requires rotation pattern');
        }
        if (!data.shiftGroups || data.shiftGroups.length === 0) {
          throw new Error('Rotating schedule requires shift groups');
        }
        break;

      case 'HYBRID':
        if (!data.officeDays || !data.remoteDays) {
          throw new Error('Hybrid schedule requires office days and remote days');
        }
        break;
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}

let workScheduleService: WorkScheduleService;

export function getWorkScheduleService(): WorkScheduleService {
  if (!workScheduleService) {
    const { prisma } = require('@/lib/db');
    const controller = new WorkScheduleController(prisma);
    workScheduleService = new WorkScheduleService(controller);
  }
  return workScheduleService;
}
