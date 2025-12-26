import { UserRole } from '@prisma/client';

export interface CreateUserRole {
  user_id: string;
  role_id: string;
}

export interface UpdateUserRole {
  user_id?: string;
  role_id?: string;
}
