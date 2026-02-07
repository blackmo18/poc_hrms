import { prisma } from '@/lib/db';
import { generateULID } from '../utils/ulid.service';
import { CreateUser, UpdateUser } from '../models/user';
import bcrypt from 'bcryptjs';

export class UserController {
  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.user.count({
      where: organizationId ? { organizationId: organizationId } : undefined,
    });

    // Then fetch the paginated users
    const users = await prisma.user.findMany({
      where: organizationId ? { organizationId: organizationId } : undefined,
      skip,
      take: limit,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: false
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      data: users,
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
    return await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: false
              },
            },
          },
        },
      },
    });
  }

  async create(data: CreateUser) {
    // Hash the generated password
    const hashedPassword = await bcrypt.hash(data.generatedPassword || 'defaultPassword123', 10);
    
    // Get employee to determine organization
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { organization: true }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Create user with employee's organization
    let user;
    try {
      user = await prisma.user.create({
        data: {
          id: generateULID(),
          email: data.email,
          passwordHash: hashedPassword,
          organizationId: employee.organizationId,
          employeeId: data.employeeId,
          status: data.status || 'ACTIVE',
        } as any,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error: any) {
      // Re-throw duplicate email errors to be handled by the API route
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error('A user with this email already exists');
      }
      throw error;
    }

    // Assign roles to user
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: data.roleIds.map(roleId => ({
          id: generateULID(),
          userId: user.id,
          roleId: roleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      });

      // Refetch user with roles
      return await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    return user;
  }

  async update(id: string, data: UpdateUser) {
    let updateData: any = { ...data };
    
    // Handle password updates
    if (data.generatedPassword) {
      updateData.passwordHash = await bcrypt.hash(data.generatedPassword, 10);
      delete updateData.generatedPassword; // Remove this field as it's not in the schema
    } else if (data.passwordHash) {
      updateData.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }
    
    // Remove roleIds from direct update as it needs separate handling
    const roleIds = data.roleIds;
    delete updateData.roleIds;
    
    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Update roles if provided
    if (roleIds !== undefined) {
      // Delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Add new roles
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map(roleId => ({
            id: generateULID(),
            userId: id,
            roleId: roleId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        });
      }

      // Refetch user with updated roles
      return await prisma.user.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    return user;
  }

  async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async getByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async verifyPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || '');
    
    if (!isValid) {
      return null;
    }

    return user;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getById(userId);
    if (!user) return [];
    
    const roleIds = user.userRoles.map(ur => ur.roleId);
    
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleIds
        }
      },
      include: {
        permission: true
      }
    });
    
    const permissions = rolePermissions.map(rp => rp.permission.name);
    return [...new Set(permissions)]; // Remove duplicates
  }
}

export const userController = new UserController();
