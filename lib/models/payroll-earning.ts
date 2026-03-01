import { z } from 'zod';
import { PayrollEarningType } from '@prisma/client';

export const PayrollEarningSchema = z.object({
  id: z.string().optional(),
  payrollId: z.string().min(1, 'Payroll ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  type: z.nativeEnum(PayrollEarningType, {
    message: 'Invalid earning type',
  }),
  hours: z.number().min(0, 'Hours cannot be negative'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  amount: z.number().positive('Amount must be positive'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => {
  // For most types, amount should equal hours * rate
  // But some types like base salary with 0 hours have custom amounts
  if (data.hours === 0 && data.rate === 0) {
    return true; // Skip validation for zero hours/rate (e.g., bonuses, allowances)
  }
  
  // Allow small tolerance for floating point arithmetic
  const calculatedAmount = data.hours * data.rate;
  const tolerance = 0.01;
  return Math.abs(data.amount - calculatedAmount) <= tolerance;
}, {
  message: 'Amount must equal hours multiplied by rate (except for zero hours/rate entries)',
  path: ['amount'],
});

export type PayrollEarning = z.infer<typeof PayrollEarningSchema>;

export const CreatePayrollEarningSchema = PayrollEarningSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePayrollEarning = z.infer<typeof CreatePayrollEarningSchema>;

export const UpdatePayrollEarningSchema = CreatePayrollEarningSchema.partial().omit({
  payrollId: true,
  organizationId: true,
  employeeId: true,
});

export type UpdatePayrollEarning = z.infer<typeof UpdatePayrollEarningSchema>;

export const BulkCreatePayrollEarningsSchema = z.array(CreatePayrollEarningSchema).min(1, 'At least one earning is required');

export type BulkCreatePayrollEarnings = z.infer<typeof BulkCreatePayrollEarningsSchema>;

export const EarningSummarySchema = z.object({
  type: z.nativeEnum(PayrollEarningType),
  totalHours: z.number(),
  totalAmount: z.number(),
  averageRate: z.number(),
  count: z.number().optional(),
});

export type EarningSummary = z.infer<typeof EarningSummarySchema>;

export const PayrollEarningFilterSchema = z.object({
  organizationId: z.string().optional(),
  payrollId: z.string().optional(),
  employeeId: z.string().optional(),
  type: z.nativeEnum(PayrollEarningType).optional(),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
}).refine((data) => {
  if (data.periodStart && data.periodEnd) {
    return data.periodStart < data.periodEnd;
  }
  return true;
}, {
  message: 'Period start must be before period end',
  path: ['periodStart'],
});

export type PayrollEarningFilter = z.infer<typeof PayrollEarningFilterSchema>;

// Schemas for specific earning calculations
export const OvertimeEarningSchema = z.object({
  employeeId: z.string(),
  organizationId: z.string(),
  regularHours: z.number().min(0),
  overtimeHours: z.number().min(0),
  hourlyRate: z.number().positive(),
  overtimeRate: z.number().positive().default(1.25),
});

export type OvertimeEarning = z.infer<typeof OvertimeEarningSchema>;

export const NightDifferentialEarningSchema = z.object({
  employeeId: z.string(),
  organizationId: z.string(),
  nightDiffHours: z.number().min(0),
  hourlyRate: z.number().positive(),
  nightDiffRate: z.number().min(0).max(1).default(0.10),
});

export type NightDifferentialEarning = z.infer<typeof NightDifferentialEarningSchema>;

export const HolidayEarningSchema = z.object({
  employeeId: z.string(),
  organizationId: z.string(),
  hoursWorked: z.number().min(0),
  hourlyRate: z.number().positive(),
  holidayType: z.enum(['REGULAR', 'SPECIAL', 'DOUBLE']),
  isRestDay: z.boolean().default(false),
});

export type HolidayEarning = z.infer<typeof HolidayEarningSchema>;

export const AllowanceEarningSchema = z.object({
  employeeId: z.string(),
  organizationId: z.string(),
  allowanceType: z.enum(['COLA', 'TRANSPORTATION', 'MEAL', 'OTHER']),
  amount: z.number().positive(),
});

export type AllowanceEarning = z.infer<typeof AllowanceEarningSchema>;

export const BonusEarningSchema = z.object({
  employeeId: z.string(),
  organizationId: z.string(),
  bonusType: z.enum(['PERFORMANCE', 'CHRISTMAS', '13TH_MONTH', 'OTHER']),
  amount: z.number().positive(),
});

export type BonusEarning = z.infer<typeof BonusEarningSchema>;
