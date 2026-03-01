import { z } from 'zod';

const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
const validTypes = ['MONTHLY', 'SEMI_MONTHLY', 'BI_WEEKLY', 'WEEKLY'];

export const PayrollPeriodSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  payDate: z.date(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  type: z.enum(['MONTHLY', 'SEMI_MONTHLY', 'BI_WEEKLY', 'WEEKLY']).default('MONTHLY'),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  periodNumber: z.number().int().positive().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => {
  // Validate date relationships
  return data.startDate < data.endDate;
}, {
  message: 'Start date must be before end date',
  path: ['startDate'],
}).refine((data) => {
  // Pay date should be after end date
  return data.endDate < data.payDate;
}, {
  message: 'Pay date must be after end date',
  path: ['payDate'],
}).refine((data) => {
  // Year should match start date year if not provided
  if (!data.year) {
    return true; // Will be set automatically
  }
  return data.year === data.startDate.getFullYear();
}, {
  message: 'Year must match start date year',
  path: ['year'],
}).refine((data) => {
  // Month should match start date month if not provided
  if (!data.month) {
    return true; // Will be set automatically
  }
  return data.month === data.startDate.getMonth() + 1;
}, {
  message: 'Month must match start date month',
  path: ['month'],
});

export type PayrollPeriod = z.infer<typeof PayrollPeriodSchema>;

export const CreatePayrollPeriodSchema = PayrollPeriodSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type CreatePayrollPeriod = z.infer<typeof CreatePayrollPeriodSchema>;

export const UpdatePayrollPeriodSchema = CreatePayrollPeriodSchema.partial().omit({
  startDate: true,
  endDate: true,
  organizationId: true,
});

export type UpdatePayrollPeriod = z.infer<typeof UpdatePayrollPeriodSchema>;

export const GeneratePayrollPeriodsSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  type: z.enum(['MONTHLY', 'SEMI_MONTHLY', 'BI_WEEKLY', 'WEEKLY']),
  startDate: z.date(),
  endDate: z.date(),
  payDayOffset: z.number().int().min(0).default(0),
}).refine((data) => {
  return data.startDate < data.endDate;
}, {
  message: 'Start date must be before end date',
  path: ['startDate'],
});

export type GeneratePayrollPeriods = z.infer<typeof GeneratePayrollPeriodsSchema>;
