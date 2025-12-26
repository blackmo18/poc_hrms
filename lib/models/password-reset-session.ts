import { z } from 'zod';

export const PasswordResetSessionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'User ID is required'),
  token: z.string().min(1, 'Token is required'),
  requested_by: z.string().min(1, 'Requested by is required'),
  created_at: z.date().optional(),
  expired_on: z.date().min(1, 'Expiry date is required'),
  validated: z.date().optional(),
});

export type PasswordResetSession = z.infer<typeof PasswordResetSessionSchema>;

export const CreatePasswordResetSessionSchema = PasswordResetSessionSchema.omit({
  id: true,
  created_at: true,
  validated: true,
}).extend({
  expired_on: z.date().default(() => new Date(Date.now() + 60 * 60 * 1000)), // 1 hour from now
});

export type CreatePasswordResetSession = z.infer<typeof CreatePasswordResetSessionSchema>;

export const UserPasswordResetLogSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'User ID is required'),
  requested_by: z.string().min(1, 'Requested by is required'),
  created_at: z.date().optional(),
  action: z.string().min(1, 'Action is required'),
});

export type UserPasswordResetLog = z.infer<typeof UserPasswordResetLogSchema>;

export const CreateUserPasswordResetLogSchema = UserPasswordResetLogSchema.omit({
  id: true,
  created_at: true,
});

export type CreateUserPasswordResetLog = z.infer<typeof CreateUserPasswordResetLogSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

export const ValidatePasswordResetSessionSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type ValidatePasswordResetSession = z.infer<typeof ValidatePasswordResetSessionSchema>;