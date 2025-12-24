import { BaseRepository } from './base.repository';
import { Permission } from '@prisma/client';

export class PermissionRepository extends BaseRepository {
  async findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async create(data: Omit<Permission, 'created_at' | 'updated_at'>): Promise<Permission> {
    return this.prisma.permission.create({
      data,
    });
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Permission> {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}

let permissionRepository: PermissionRepository;

export function getPermissionRepository(): PermissionRepository {
  if (!permissionRepository) {
    permissionRepository = new PermissionRepository();
  }
  return permissionRepository;
}
