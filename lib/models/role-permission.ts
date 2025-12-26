import { RolePermission } from '@prisma/client';

export interface CreateRolePermission {
  role_id: string;
  permission_id: string;
}

export interface UpdateRolePermission {
  role_id?: string;
  permission_id?: string;
}
