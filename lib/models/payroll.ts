import { z } from 'zod';

export const PayrollSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  departmentId: z.string().optional(),
  periodStart: z.date(),
  periodEnd: z.date(),
  grossPay: z.number().min(0, 'Gross pay must be positive'),
  netPay: z.number().min(0, 'Net pay must be positive'),
  processedAt: z.date().optional(),
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
