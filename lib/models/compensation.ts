import { z } from 'zod';

export const CompensationSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  departmentId: z.string().optional(),
  baseSalary: z.number().min(0, 'Base salary must be positive'),
  payFrequency: z.enum(['MONTHLY', 'SEMI_MONTHLY', 'BI_WEEKLY', 'WEEKLY']),
  effectiveDate: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Compensation = z.infer<typeof CompensationSchema>;

export const CreateCompensationSchema = CompensationSchema.omit({
  id: true,
  created_at: true,
});

export type CreateCompensation = z.infer<typeof CreateCompensationSchema>;

export const UpdateCompensationSchema = CreateCompensationSchema.partial();
export type UpdateCompensation = z.infer<typeof UpdateCompensationSchema>;
