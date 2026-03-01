import { z } from 'zod';

// BreakType enum
export const BreakType = {
  MEAL: 'MEAL',
  REST: 'REST',
  PERSONAL: 'PERSONAL',
  SYSTEM: 'SYSTEM',
} as const;

export type BreakTypeEnum = typeof BreakType[keyof typeof BreakType];

// TimeBreak create schema (camelCase in code)
export const CreateTimeBreakSchema = z.object({
  timeEntryId: z.string(),
  breakStartAt: z.date(),
  breakEndAt: z.date().optional(),
  breakType: z.enum([BreakType.MEAL, BreakType.REST, BreakType.PERSONAL, BreakType.SYSTEM]).default(BreakType.REST),
  isPaid: z.boolean().default(false),
});

export type CreateTimeBreak = z.infer<typeof CreateTimeBreakSchema>;

// TimeBreak update schema (camelCase in code)
export const UpdateTimeBreakSchema = z.object({
  breakEndAt: z.date().optional(),
  breakType: z.enum([BreakType.MEAL, BreakType.REST, BreakType.PERSONAL, BreakType.SYSTEM]).optional(),
  isPaid: z.boolean().optional(),
});

export type UpdateTimeBreak = z.infer<typeof UpdateTimeBreakSchema>;

// TimeBreak filters (camelCase in code)
export const TimeBreakFiltersSchema = z.object({
  timeEntryId: z.string().optional(),
  breakType: z.enum([BreakType.MEAL, BreakType.REST, BreakType.PERSONAL, BreakType.SYSTEM]).optional(),
  isPaid: z.boolean().optional(),
});

export type TimeBreakFilters = z.infer<typeof TimeBreakFiltersSchema>;

// TimeBreak with relations type
export type TimeBreakWithRelations = {
  id: string;
  timeEntryId: string;
  breakStartAt: Date;
  breakEndAt: Date;
  breakType: BreakTypeEnum;
  isPaid: boolean;
  durationMinutes: number | null;
  employeeId: string;
  organizationId: string;
  timeEntry: {
    id: string;
    employeeId: string;
    workDate: Date;
  };
};
