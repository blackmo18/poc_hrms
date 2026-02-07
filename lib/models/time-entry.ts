import { z } from 'zod';

// TimeEntry status enum
export const TimeEntryStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export type TimeEntryStatusType = typeof TimeEntryStatus[keyof typeof TimeEntryStatus];

// TimeEntry create schema
export const CreateTimeEntrySchema = z.object({
  employeeId: z.string(),
  organizationId: z.string(),
  departmentId: z.string().optional(),
  clockInAt: z.date(),
  clockOutAt: z.date().optional(),
  workDate: z.date(),
  status: z.enum([TimeEntryStatus.OPEN, TimeEntryStatus.CLOSED]).default(TimeEntryStatus.OPEN),
});

export type CreateTimeEntry = z.infer<typeof CreateTimeEntrySchema>;

// TimeEntry update schema
export const UpdateTimeEntrySchema = z.object({
  clockOutAt: z.date().optional(),
  totalWorkMinutes: z.number().int().min(0).optional(),
  status: z.enum([TimeEntryStatus.OPEN, TimeEntryStatus.CLOSED]).optional(),
});

export type UpdateTimeEntry = z.infer<typeof UpdateTimeEntrySchema>;

// TimeEntry filters
export const TimeEntryFiltersSchema = z.object({
  employeeId: z.string().optional(),
  organizationId: z.string().optional(),
  departmentId: z.string().optional(),
  workDate: z.date().optional(),
  status: z.enum([TimeEntryStatus.OPEN, TimeEntryStatus.CLOSED]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type TimeEntryFilters = z.infer<typeof TimeEntryFiltersSchema>;

// TimeEntry with relations type
export type TimeEntryWithRelations = {
  id: string;
  employeeId: string;
  organizationId: string;
  departmentId: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  workDate: Date;
  totalWorkMinutes: number | null;
  status: TimeEntryStatusType;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  timeBreaks: {
    id: string;
    breakStartAt: Date;
    breakEndAt: Date | null;
    breakType: string;
    isPaid: boolean;
  }[];
};
