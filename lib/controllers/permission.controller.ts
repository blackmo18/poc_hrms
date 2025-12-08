import { prisma } from '../db';
import { CreatePermission, UpdatePermission } from '../models/permission';

export class PermissionController {
  async getAll(organizationId?: number) {
    return await prisma.permission.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      include: {
        rolePermissions: {
          include: {
            role: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getById(id: number) {
    return await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: {
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
                }
              }
            }
          }
        }
      }
    });
  }

  async create(data: CreatePermission) {
    return await prisma.permission.create({
      data,
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async update(id: number, data: UpdatePermission) {
    return await prisma.permission.update({
      where: { id },
      data,
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async delete(id: number) {
    // First, delete all role-permission associations
    await prisma.rolePermission.deleteMany({
      where: { permission_id: id }
    });

    // Then, delete the permission
    return await prisma.permission.delete({
      where: { id }
    });
  }

  async getRolesWithPermission(permissionId: number) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: {
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
                }
              }
            }
          }
        }
      }
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return permission.rolePermissions.map(rp => rp.role);
  }

  async assignToRole(permissionId: number, roleId: number) {
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

  async removeFromRole(permissionId: number, roleId: number) {
    return await prisma.rolePermission.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId
      }
    });
  }

  async getSystemPermissions() {
    // Get all permissions that are not organization-specific
    return await prisma.permission.findMany({
      where: {
        organization_id: null
      },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getOrganizationPermissions(organizationId: number) {
    // Get all permissions for a specific organization
    return await prisma.permission.findMany({
      where: {
        organization_id: organizationId
      },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async bulkCreate(permissions: CreatePermission[]) {
    const createdPermissions = await prisma.permission.createMany({
      data: permissions,
      skipDuplicates: true
    });

    // Return the created permissions with full details
    return await prisma.permission.findMany({
      where: {
        name: {
          in: permissions.map(p => p.name)
        }
      },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async getPermissionsByRoleId(roleId: number): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => rp.permission.name);
  }

  async getPermissionDetailsByRoleId(roleId: number) {
    return await prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: {
        permission: true,
        role: {
          include: {
            organization: true
          }
        }
      }
    });
  }
}

export const permissionController = new PermissionController();
