import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Invalid email address'),
  contact_number: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url('Invalid URL').optional(),
  description: z.string().optional(),
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
