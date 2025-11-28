import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.bigint().optional(),
  organization_id: z.bigint().min(1n, 'Organization ID is required'),
  user_id: z.bigint().optional(),
  department_id: z.bigint().min(1n, 'Department ID is required'),
  job_title_id: z.bigint().min(1n, 'Job title ID is required'),
  manager_id: z.bigint().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  employment_status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE']).default('ACTIVE'),
  hire_date: z.date(),
  exit_date: z.date().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
