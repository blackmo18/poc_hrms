import { getPermissionRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { Permission } from '@prisma/client';

export class PermissionService {
  private permissionRepository = getPermissionRepository();

  async getById(id: string): Promise<Permission | null> {
    return await this.permissionRepository.findById(id);
  }

  async getByName(name: string): Promise<Permission | null> {
    return await this.permissionRepository.findByName(name);
  }

  async getAll(): Promise<Permission[]> {
    return await this.permissionRepository.findAll();
  }

  async create(data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>): Promise<Permission> {
    const id = generateULID();
    return await this.permissionRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    return await this.permissionRepository.update(id, data);
  }

  async delete(id: string): Promise<Permission> {
    return await this.permissionRepository.delete(id);
  }
}

let permissionService: PermissionService;

export function getPermissionService(): PermissionService {
  if (!permissionService) {
    permissionService = new PermissionService();
  }
  return permissionService;
}
