import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateRolePermission } from '../models/role-permission';

export class RolePermissionController {
  async getAll() {
    return await prisma.rolePermission.findMany();
  }

  async getById(id: string) {
    return await prisma.rolePermission.findUnique({
      where: { id }
    });
  }

  async getByRoleId(roleId: string) {
    return await prisma.rolePermission.findMany({
      where: { role_id: roleId }
    });
  }

  async getByPermissionId(permissionId: string) {
    return await prisma.rolePermission.findMany({
      where: { permission_id: permissionId }
    });
  }

  async create(data: CreateRolePermission) {
    return await prisma.rolePermission.create({
      data: { id: generateULID(), ...data }
    });
  }

  async delete(id: string) {
    return await prisma.rolePermission.delete({
      where: { id }
    });
  }

  async deleteByRoleAndPermission(roleId: string, permissionId: string) {
    const result = await prisma.rolePermission.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId
      }
    });
    return result.count;
  }
}

export const rolePermissionController = new RolePermissionController();
