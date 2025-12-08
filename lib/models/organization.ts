import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Organization name is required'),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const CreateOrganizationSchema = OrganizationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();
export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;
