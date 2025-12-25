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

  async findAllWithPagination(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.permission.count({
      where: organizationId ? { organization_id: organizationId } : undefined,
    });

    // Get paginated permissions
    const permissions = await this.prisma.permission.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      skip,
      take: limit,
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        organization: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      data: permissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
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

  async findByIdWithRelations(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        organization: true,
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
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
