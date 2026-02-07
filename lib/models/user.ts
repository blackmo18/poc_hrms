import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Valid email is required'),
  passwordHash: z.string().min(1, 'Password hash is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true, // We'll generate this from generatedPassword
}).extend({
  employeeId: z.string().min(1, 'Employee ID is required'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  generatedPassword: z.string().optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
  passwordHash: z.string().min(1, 'Password hash is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  organizationId: z.string().min(1, 'Organization ID is required').optional(),
  employeeId: z.string().min(1, 'Employee ID is required').optional(),
  roleIds: z.array(z.string()).optional(),
  generatedPassword: z.string().optional(),
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
  employeeId?: string; // Optional, used in some contexts
  name?: string; // Optional, legacy field - use employee name instead
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    customId?: string;
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
  createdAt: string;
}
