import { z } from 'zod';

export const PermissionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional(),
  organizationId: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

export const CreatePermissionSchema = PermissionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePermission = z.infer<typeof CreatePermissionSchema>;

export const UpdatePermissionSchema = CreatePermissionSchema.partial();
export type UpdatePermission = z.infer<typeof UpdatePermissionSchema>;
