import { prisma } from '../db';
import { CreateRole, UpdateRole } from '../models/role';

export class RoleController {
  async getAll(organizationId?: number) {
    return await prisma.role.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      include: {
        organization: true,
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
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
  }

  async getById(id: number) {
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
                name: true
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

  async update(id: number, data: UpdateRole) {
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

  async delete(id: number) {
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

  async assignPermission(roleId: number, permissionId: number) {
    return await prisma.rolePermission.create({
      data: {
        role_id: roleId,
        permission_id: permissionId
      },
      include: {
        role: true,
        permission: true
      }
    });
  }

  async removePermission(roleId: number, permissionId: number) {
    return await prisma.rolePermission.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId
      }
    });
  }

  async getRolePermissions(roleId: number) {
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

  async getUsersWithRole(roleId: number) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
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
}

export const roleController = new RoleController();
