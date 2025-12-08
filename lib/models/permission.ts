import { z } from 'zod';

export const PermissionSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional(),
  organization_id: z.number().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

export const CreatePermissionSchema = PermissionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreatePermission = z.infer<typeof CreatePermissionSchema>;

export const UpdatePermissionSchema = CreatePermissionSchema.partial();
export type UpdatePermission = z.infer<typeof UpdatePermissionSchema>;
