import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  userId: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  jobTitleId: z.string().min(1, 'Job title ID is required'),
  managerId: z.string().optional(),
  custom_id: z.string().optional(), // Organization-specific employee ID
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  // Work details
  work_email: z.string().email('Valid work email is required').optional(),
  work_contact: z.string().optional(),
  // Personal details
  personalAddress: z.string().min(1, 'Personal address is required'),
  personalContactNumber: z.string().min(1, 'Personal contact number is required'),
  personal_email: z.string().email('Valid personal email is required').optional(),
  dateOfBirth: z.date(),
  gender: z.string().min(1, 'Gender is required'),
  employmentStatus: z.enum(['ACTIVE', 'RESIGNED', 'TERMINATED', 'RETIRED']).default('ACTIVE'),
  hireDate: z.date(),
  exitDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
