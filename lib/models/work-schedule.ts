import { z } from 'zod';
import { ScheduleType } from '@prisma/client';

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const WorkScheduleSchema = z.object({
  id: z.string().optional(),
  compensationId: z.string().min(1, 'Compensation ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  scheduleType: z.nativeEnum(ScheduleType).default('FIXED'),
  defaultStart: z.string().regex(timeRegex, 'Invalid start time format. Use HH:MM').optional(),
  defaultEnd: z.string().regex(timeRegex, 'Invalid end time format. Use HH:MM').optional(),
  workDays: z.array(z.enum(validDays as [string, ...string[]])).default(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']),
  restDays: z.array(z.enum(validDays as [string, ...string[]])).default(['SATURDAY', 'SUNDAY']),
  overtimeRate: z.number().positive('Overtime rate must be positive').default(1.25),
  restDayRate: z.number().positive('Rest day rate must be positive').default(1.30),
  holidayRate: z.number().positive('Holiday rate must be positive').default(1.30),
  specialHolidayRate: z.number().positive('Special holiday rate must be positive').default(1.30),
  doubleHolidayRate: z.number().positive('Double holiday rate must be positive').default(2.00),
  nightShiftStart: z.string().regex(timeRegex, 'Invalid night shift start time').default('22:00'),
  nightShiftEnd: z.string().regex(timeRegex, 'Invalid night shift end time').default('06:00'),
  nightDiffRate: z.number().min(0, 'Night diff rate cannot be negative').default(0.10),
  rotationPattern: z.string().optional(),
  rotationStart: z.date().optional(),
  shiftGroups: z.array(z.string()).optional(),
  officeDays: z.array(z.enum(validDays as [string, ...string[]])).optional(),
  remoteDays: z.array(z.enum(validDays as [string, ...string[]])).optional(),
  coreHoursStart: z.string().regex(timeRegex, 'Invalid core hours start time').optional(),
  coreHoursEnd: z.string().regex(timeRegex, 'Invalid core hours end time').optional(),
  totalHoursPerWeek: z.number().positive('Total hours per week must be positive').optional(),
  isMonthlyRate: z.boolean().default(true),
  monthlyRate: z.number().positive('Monthly rate must be positive').optional(),
  dailyRate: z.number().positive('Daily rate must be positive').optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  gracePeriodMinutes: z.number().min(0, 'Grace period cannot be negative').default(0),
  requiredWorkMinutes: z.number().positive('Required work minutes must be positive').default(480),
  maxRegularHours: z.number().positive('Max regular hours must be positive').default(8),
  maxOvertimeHours: z.number().positive('Max overtime hours must be positive').default(3),
  allowLateDeduction: z.boolean().default(false),
  maxDeductionPerDay: z.number().positive('Max deduction per day must be positive').optional(),
  maxDeductionPerMonth: z.number().positive('Max deduction per month must be positive').optional(),
  isFlexibleSchedule: z.boolean().default(false),
  minHoursPerDay: z.number().positive('Min hours per day must be positive').optional(),
  maxHoursPerDay: z.number().positive('Max hours per day must be positive').optional(),
  canLogAnyHours: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => {
  // Work days and rest days should not overlap
  const workDaysSet = new Set(data.workDays);
  const restDaysSet = new Set(data.restDays);
  const overlap = [...workDaysSet].some(day => restDaysSet.has(day));
  return !overlap;
}, {
  message: 'Work days and rest days cannot overlap',
  path: ['workDays'],
}).refine((data) => {
  // Validate schedule type requirements
  switch (data.scheduleType) {
    case 'FIXED':
      return data.defaultStart && data.defaultEnd;
    case 'FLEXIBLE':
      return data.coreHoursStart && data.coreHoursEnd && data.totalHoursPerWeek;
    case 'ROTATING':
      return data.rotationPattern && data.shiftGroups && data.shiftGroups.length > 0;
    case 'HYBRID':
      return data.officeDays && data.remoteDays && data.officeDays.length > 0 && data.remoteDays.length > 0;
    default:
      return true;
  }
}, {
  message: 'Missing required fields for schedule type',
  path: ['scheduleType'],
}).refine((data) => {
  // Validate time ranges
  if (data.defaultStart && data.defaultEnd) {
    const start = parseInt(data.defaultStart.replace(':', ''));
    const end = parseInt(data.defaultEnd.replace(':', ''));
    return start < end;
  }
  if (data.coreHoursStart && data.coreHoursEnd) {
    const start = parseInt(data.coreHoursStart.replace(':', ''));
    const end = parseInt(data.coreHoursEnd.replace(':', ''));
    return start < end;
  }
  return true;
}, {
  message: 'Start time must be before end time',
  path: ['defaultStart'],
});

export type WorkSchedule = z.infer<typeof WorkScheduleSchema>;

export const CreateWorkScheduleSchema = WorkScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateWorkSchedule = z.infer<typeof CreateWorkScheduleSchema>;

export const UpdateWorkScheduleSchema = CreateWorkScheduleSchema.partial();
export type UpdateWorkSchedule = z.infer<typeof UpdateWorkScheduleSchema>;
