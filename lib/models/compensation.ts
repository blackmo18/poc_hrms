import { z } from 'zod';

export const CompensationSchema = z.object({
  id: z.number().optional(),
  employee_id: z.string().min(1, 'Employee ID is required'),
  base_salary: z.number().min(0, 'Base salary must be positive'),
  pay_frequency: z.enum(['HOURLY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']),
  effective_date: z.date(),
  created_at: z.date().optional(),
});

export type Compensation = z.infer<typeof CompensationSchema>;

export const CreateCompensationSchema = CompensationSchema.omit({
  id: true,
  created_at: true,
});

export type CreateCompensation = z.infer<typeof CreateCompensationSchema>;

export const UpdateCompensationSchema = CreateCompensationSchema.partial();
export type UpdateCompensation = z.infer<typeof UpdateCompensationSchema>;
