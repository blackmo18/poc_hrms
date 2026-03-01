import { z } from 'zod';
import { PayrollStatus } from '@prisma/client';

export const PayrollSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  departmentId: z.string().optional(),
  periodStart: z.date(),
  periodEnd: z.date(),
  grossPay: z.number().min(0, 'Gross pay must be positive'),
  netPay: z.number().min(0, 'Net pay must be positive'),
  taxableIncome: z.number().optional(),
  taxDeduction: z.number().optional(),
  philhealthDeduction: z.number().optional(),
  sssDeduction: z.number().optional(),
  pagibigDeduction: z.number().optional(),
  totalDeductions: z.number().optional(),
  processedAt: z.date().optional(),
  status: z.nativeEnum(PayrollStatus).default(PayrollStatus.DRAFT),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(),
  releasedAt: z.date().optional(),
  releasedBy: z.string().optional(),
  voidedAt: z.date().optional(),
  voidedBy: z.string().optional(),
  voidReason: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Payroll = z.infer<typeof PayrollSchema>;

export const CreatePayrollSchema = PayrollSchema.omit({
  id: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePayroll = z.infer<typeof CreatePayrollSchema>;

export const UpdatePayrollSchema = CreatePayrollSchema.partial();
export type UpdatePayroll = z.infer<typeof UpdatePayrollSchema>;
