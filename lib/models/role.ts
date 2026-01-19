import { z } from 'zod';

export const RoleSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Role = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateRole = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = CreateRoleSchema.partial();
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
