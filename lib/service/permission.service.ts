import { permissionController } from '@/lib/controllers/permission.controller';
import { generateULID } from '@/lib/utils/ulid.service';
import { Permission } from '@prisma/client';

export class PermissionService {
  async getById(id: string): Promise<Permission | null> {
    return await permissionController.getById(id);
  }

  async getByName(name: string): Promise<Permission | null> {
    // Assuming controller has this method, if not, we can implement it
    const permissions = await permissionController.getAll();
    return permissions.find(p => p.name === name) || null;
  }

  async getAll(): Promise<Permission[]> {
    return await permissionController.getAll();
  }

  async getAllWithPagination(organizationId?: string, options?: { page?: number; limit?: number }) {
    // Controller doesn't have pagination, so implement here or add to controller
    // For now, use getAll and slice
    const permissions = await permissionController.getAll(organizationId);
    const { page = 1, limit = 10 } = options || {};
    const start = (page - 1) * limit;
    const paginated = permissions.slice(start, start + limit);
    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total: permissions.length,
        totalPages: Math.ceil(permissions.length / limit),
        hasNext: start + limit < permissions.length,
        hasPrev: page > 1
      }
    };
  }

  async getByIdWithRelations(id: string) {
    return await permissionController.getById(id);
  }

  async create(data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>): Promise<Permission> {
    return await permissionController.create(data);
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    return await permissionController.update(id, data);
  }

  async delete(id: string): Promise<Permission> {
    return await permissionController.delete(id);
  }
}

let permissionService: PermissionService;

export function getPermissionService(): PermissionService {
  if (!permissionService) {
    permissionService = new PermissionService();
  }
  return permissionService;
}
