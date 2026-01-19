import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateRole, UpdateRole } from '../models/role';

export class RoleController {
  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.role.count({
      where: organizationId ? { organizationId: organizationId } : undefined,
    });

    // Then fetch the paginated roles
    const roles = await prisma.role.findMany({
      where: organizationId ? { organizationId: organizationId } : undefined,
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
                    firstName: true,
                    lastName: true,
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
                    firstName: true,
                    lastName: true,
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
      data: { id: generateULID(), ...data } as any,
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
      where: { roleId: id }
    });

    // Then, delete all role-permission associations
    await prisma.rolePermission.deleteMany({
      where: { roleId: id }
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
        roleId: roleId,
        permissionId: permissionId
      } as any,
      include: {
        role: true,
        permission: true
      }
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    return await prisma.rolePermission.deleteMany({
      where: {
        roleId: roleId,
        permissionId: permissionId
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
                    firstName: true,
                    lastName: true,
                  },
                },
                status: true,
                organizationId: true
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
  async findByName(name: string, organizationId?: string) {
    return await prisma.role.findFirst({
      where: { name, ...(organizationId && { organizationId }) }
    });
  }

  async findByOrganizationId(organizationId: string) {
    return await prisma.role.findMany({
      where: { organizationId: organizationId }
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
