import { BaseRepository } from './base.repository';
import { RolePermission } from '@prisma/client';
import { generateULID } from '../utils/ulid.service';

export class RolePermissionRepository extends BaseRepository {
  async findById(id: string): Promise<RolePermission | null> {
    return this.prisma.rolePermission.findUnique({
      where: { id },
    });
  }

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    return this.prisma.rolePermission.findMany({
      where: { role_id: roleId },
    });
  }

  async findByPermissionId(permissionId: string): Promise<RolePermission[]> {
    return this.prisma.rolePermission.findMany({
      where: { permission_id: permissionId },
    });
  }

  async findAll(): Promise<RolePermission[]> {
    return this.prisma.rolePermission.findMany();
  }

  async create(data: Omit<RolePermission, 'internal_id' | 'id' | 'created_at'>): Promise<RolePermission> {
    return this.prisma.rolePermission.create({
      data: { id: generateULID(), ...data },
    });
  }

  async delete(id: string): Promise<RolePermission> {
    return this.prisma.rolePermission.delete({
      where: { id },
    });
  }

  async deleteByRoleAndPermission(roleId: string, permissionId: string): Promise<number> {
    const result = await this.prisma.rolePermission.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });
    return result.count;
  }
}

let rolePermissionRepository: RolePermissionRepository;

export function getRolePermissionRepository(): RolePermissionRepository {
  if (!rolePermissionRepository) {
    rolePermissionRepository = new RolePermissionRepository();
  }
  return rolePermissionRepository;
}
