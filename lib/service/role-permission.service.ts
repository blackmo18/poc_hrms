import { getRolePermissionRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { RolePermission } from '@prisma/client';

export class RolePermissionService {
  private rolePermissionRepository = getRolePermissionRepository();

  async getById(id: string): Promise<RolePermission | null> {
    return await this.rolePermissionRepository.findById(id);
  }

  async getByRoleId(roleId: string): Promise<RolePermission[]> {
    return await this.rolePermissionRepository.findByRoleId(roleId);
  }

  async getByPermissionId(permissionId: string): Promise<RolePermission[]> {
    return await this.rolePermissionRepository.findByPermissionId(permissionId);
  }

  async getAll(): Promise<RolePermission[]> {
    return await this.rolePermissionRepository.findAll();
  }

  async create(data: Omit<RolePermission, 'internal_id' | 'id' | 'created_at'>): Promise<RolePermission> {
    return await this.rolePermissionRepository.create(data);
  }

  async delete(id: string): Promise<RolePermission> {
    return await this.rolePermissionRepository.delete(id);
  }

  async deleteByRoleAndPermission(roleId: string, permissionId: string): Promise<number> {
    return this.rolePermissionRepository.deleteByRoleAndPermission(roleId, permissionId);
  }
}

let rolePermissionService: RolePermissionService;

export function getRolePermissionService(): RolePermissionService {
  if (!rolePermissionService) {
    rolePermissionService = new RolePermissionService();
  }
  return rolePermissionService;
}
