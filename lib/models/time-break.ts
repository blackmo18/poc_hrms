import { z } from 'zod';

// BreakType enum
export const BreakType = {
  MEAL: 'MEAL',
  REST: 'REST',
  PERSONAL: 'PERSONAL',
  SYSTEM: 'SYSTEM',
} as const;

export type BreakTypeEnum = typeof BreakType[keyof typeof BreakType];

// TimeBreak create schema
export const CreateTimeBreakSchema = z.object({
  timesheet_id: z.string(),
  break_start_at: z.date(),
  break_end_at: z.date().optional(),
  break_type: z.enum([BreakType.MEAL, BreakType.REST, BreakType.PERSONAL, BreakType.SYSTEM]).default(BreakType.REST),
  is_paid: z.boolean().default(false),
});

export type CreateTimeBreak = z.infer<typeof CreateTimeBreakSchema>;

// TimeBreak update schema
export const UpdateTimeBreakSchema = z.object({
  break_end_at: z.date().optional(),
  break_type: z.enum([BreakType.MEAL, BreakType.REST, BreakType.PERSONAL, BreakType.SYSTEM]).optional(),
  is_paid: z.boolean().optional(),
});

export type UpdateTimeBreak = z.infer<typeof UpdateTimeBreakSchema>;

// TimeBreak filters
export const TimeBreakFiltersSchema = z.object({
  timesheet_id: z.string().optional(),
  break_type: z.enum([BreakType.MEAL, BreakType.REST, BreakType.PERSONAL, BreakType.SYSTEM]).optional(),
  is_paid: z.boolean().optional(),
});

export type TimeBreakFilters = z.infer<typeof TimeBreakFiltersSchema>;

// TimeBreak with relations type
export type TimeBreakWithRelations = {
  id: string;
  timeEntryId: string;
  breakStartAt: Date;
  breakEndAt: Date | null;
  breakType: BreakTypeEnum;
  isPaid: boolean;
  createdAt: Date;
  employeeId: string;
  organizationId: string;
  timeEntry: {
    id: string;
    employeeId: string;
    workDate: Date;
  };
};
