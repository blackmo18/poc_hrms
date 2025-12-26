import { rolePermissionController } from '@/lib/controllers/role-permission.controller';
import { CreateRolePermission } from '@/lib/models/role-permission';
import { RolePermission } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class RolePermissionService {
  async getById(id: string): Promise<RolePermission | null> {
    return await rolePermissionController.getById(id);
  }

  async getByRoleId(roleId: string): Promise<RolePermission[]> {
    return await rolePermissionController.getByRoleId(roleId);
  }

  async getByPermissionId(permissionId: string): Promise<RolePermission[]> {
    return await rolePermissionController.getByPermissionId(permissionId);
  }

  async getAll(): Promise<RolePermission[]> {
    return await rolePermissionController.getAll();
  }

  async create(data: CreateRolePermission): Promise<RolePermission> {
    return await rolePermissionController.create(data);
  }

  async delete(id: string): Promise<RolePermission> {
    return await rolePermissionController.delete(id);
  }

  async deleteByRoleAndPermission(roleId: string, permissionId: string): Promise<number> {
    return await rolePermissionController.deleteByRoleAndPermission(roleId, permissionId);
  }
}

let rolePermissionService: RolePermissionService;

export function getRolePermissionService(): RolePermissionService {
  if (!rolePermissionService) {
    rolePermissionService = new RolePermissionService();
  }
  return rolePermissionService;
}
