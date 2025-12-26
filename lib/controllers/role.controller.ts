import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateRole, UpdateRole } from '../models/role';

export class RoleController {
  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.role.count({
      where: organizationId ? { organization_id: organizationId } : undefined,
    });

    // Then fetch the paginated roles
    const roles = await prisma.role.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      skip,
      take: limit,
      include: {
        organization: true,
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              }
            }
          }
        },
        rolePermissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return {
      data: roles,
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

  async getById(id: string) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        organization: true,
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              }
            }
          }
        },
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async create(data: CreateRole) {
    return await prisma.role.create({
      data: { id: generateULID(), ...data },
      include: {
        organization: true,
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async update(id: string, data: UpdateRole) {
    return await prisma.role.update({
      where: { id },
      data,
      include: {
        organization: true,
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async delete(id: string) {
    // First, delete all user-role associations
    await prisma.userRole.deleteMany({
      where: { role_id: id }
    });

    // Then, delete all role-permission associations
    await prisma.rolePermission.deleteMany({
      where: { role_id: id }
    });

    // Finally, delete the role
    return await prisma.role.delete({
      where: { id }
    });
  }

  async assignPermission(roleId: string, permissionId: string) {
    return await prisma.rolePermission.create({
      data: {
        id: generateULID(),
        role_id: roleId,
        permission_id: permissionId
      },
      include: {
        role: true,
        permission: true
      }
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    return await prisma.rolePermission.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId
      }
    });
  }

  async getRolePermissions(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.rolePermissions.map(rp => rp.permission);
  }

  async getUsersWithRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
                status: true,
                organization_id: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.userRoles.map(ur => ur.user);
  }

  // Simple repository methods for internal use
  async findByName(name: string) {
    return await prisma.role.findUnique({
      where: { name }
    });
  }

  async findByOrganizationId(organizationId: string) {
    return await prisma.role.findMany({
      where: { organization_id: organizationId }
    });
  }

  async getPermissionsByRoleIds(roleIds: string[]) {
    const roles = await prisma.role.findMany({
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

export const roleController = new RoleController();
