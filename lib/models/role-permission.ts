import { RolePermission } from '@prisma/client';

export interface CreateRolePermission {
  roleId: string;
  permissionId: string;
}

export interface UpdateRolePermission {
  roleId?: string;
  permissionId?: string;
}
