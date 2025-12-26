import { roleController } from '@/lib/controllers/role.controller';
import { CreateRole, UpdateRole } from '@/lib/models/role';
import { Role } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class RoleService {
  async getById(id: string): Promise<Role | null> {
    return await roleController.getById(id);
  }

  async getByName(name: string): Promise<Role | null> {
    const result = await roleController.getAll();
    return result.data.find(r => r.name === name) || null;
  }

  async getByOrganizationId(organizationId: string): Promise<Role[]> {
    const result = await roleController.getAll(organizationId);
    return result.data;
  }

  async getAll(): Promise<Role[]> {
    const result = await roleController.getAll();
    return result.data;
  }

  async create(data: CreateRole): Promise<Role> {
    return await roleController.create(data);
  }

  async update(id: string, data: UpdateRole): Promise<Role> {
    return await roleController.update(id, data);
  }

  async delete(id: string): Promise<Role> {
    return await roleController.delete(id);
  }

  async getPermissionsByRoleIds(roleIds: string[]): Promise<string[]> {
    const permissions = [];
    for (const roleId of roleIds) {
      const perms = await roleController.getRolePermissions(roleId);
      permissions.push(...perms.map(p => p.name));
    }
    return [...new Set(permissions)]; // Remove duplicates
  }
}

let roleService: RoleService;

export function getRoleService(): RoleService {
  if (!roleService) {
    roleService = new RoleService();
  }
  return roleService;
}
