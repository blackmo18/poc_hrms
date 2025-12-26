import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Valid email is required'),
  password_hash: z.string().min(1, 'Password hash is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  password_hash: true, // We'll generate this from generated_password
}).extend({
  employee_id: z.string().min(1, 'Employee ID is required'),
  role_ids: z.array(z.string()).min(1, 'At least one role is required'),
  generated_password: z.string().optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
  password_hash: z.string().min(1, 'Password hash is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  organization_id: z.string().min(1, 'Organization ID is required').optional(),
  employee_id: z.string().min(1, 'Employee ID is required').optional(),
  role_ids: z.array(z.string()).optional(),
  generated_password: z.string().optional(),
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type Login = z.infer<typeof LoginSchema>;

// Consolidated User interface for frontend components
export interface UserWithRelations {
  id: string;
  email: string;
  status: string;
  employee_id?: string; // Optional, used in some contexts
  name?: string; // Optional, legacy field - use employee name instead
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    custom_id?: string;
  };
  organization: {
    id: string;
    name: string;
  };
  userRoles: {
    role: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}
