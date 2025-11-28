import { z } from 'zod';

export const PayrollSchema = z.object({
  id: z.bigint().optional(),
  employee_id: z.bigint().min(1n, 'Employee ID is required'),
  period_start: z.date(),
  period_end: z.date(),
  gross_salary: z.number().min(0, 'Gross salary must be positive'),
  net_salary: z.number().min(0, 'Net salary must be positive'),
  processed_at: z.date().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Payroll = z.infer<typeof PayrollSchema>;

export const CreatePayrollSchema = PayrollSchema.omit({
  id: true,
  processed_at: true,
  created_at: true,
  updated_at: true,
});

export type CreatePayroll = z.infer<typeof CreatePayrollSchema>;

export const UpdatePayrollSchema = CreatePayrollSchema.partial();
export type UpdatePayroll = z.infer<typeof UpdatePayrollSchema>;
