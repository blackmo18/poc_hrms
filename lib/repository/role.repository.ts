import { BaseRepository } from './base.repository';
import { Role } from '@prisma/client';

export class RoleRepository extends BaseRepository {
  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: { organization_id: organizationId },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany();
  }

  async create(data: Omit<Role, 'created_at' | 'updated_at'>): Promise<Role> {
    return this.prisma.role.create({
      data,
    });
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Role> {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  async getPermissionsByRoleIds(roleIds: string[]): Promise<string[]> {
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: {
        rolePermissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    roles.forEach(role => {
      role.rolePermissions.forEach(rolePermission => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissions);
  }
}

let roleRepository: RoleRepository;

export function getRoleRepository(): RoleRepository {
  if (!roleRepository) {
    roleRepository = new RoleRepository();
  }
  return roleRepository;
}
