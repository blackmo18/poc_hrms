import { getRoleRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { Role } from '@prisma/client';

export class RoleService {
  private roleRepository = getRoleRepository();

  async getById(id: string): Promise<Role | null> {
    return await this.roleRepository.findById(id);
  }

  async getByName(name: string): Promise<Role | null> {
    return await this.roleRepository.findByName(name);
  }

  async getByOrganizationId(organizationId: string): Promise<Role[]> {
    return await this.roleRepository.findByOrganizationId(organizationId);
  }

  async getAll(): Promise<Role[]> {
    return await this.roleRepository.findAll();
  }

  async create(data: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const id = generateULID();
    return await this.roleRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    return await this.roleRepository.update(id, data);
  }

  async delete(id: string): Promise<Role> {
    return await this.roleRepository.delete(id);
  }

  async getPermissionsByRoleIds(roleIds: string[]): Promise<string[]> {
    return await this.roleRepository.getPermissionsByRoleIds(roleIds);
  }
}

let roleService: RoleService;

export function getRoleService(): RoleService {
  if (!roleService) {
    roleService = new RoleService();
  }
  return roleService;
}
