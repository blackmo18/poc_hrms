import { UserRole } from '@prisma/client';

export interface CreateUserRole {
  userId: string;
  roleId: string;
}

export interface UpdateUserRole {
  userId?: string;
  roleId?: string;
}
