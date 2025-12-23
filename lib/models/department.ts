import { z } from 'zod';

export const DepartmentSchema = z.object({
  id: z.string(),
  organization_id: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;

export const CreateDepartmentSchema = DepartmentSchema.omit({ id: true });
export type CreateDepartment = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
export type UpdateDepartment = z.infer<typeof UpdateDepartmentSchema>;
