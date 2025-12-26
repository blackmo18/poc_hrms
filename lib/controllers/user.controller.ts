import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateUser, UpdateUser } from '../models/user';
import bcrypt from 'bcryptjs';

export class UserController {
  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.user.count({
      where: organizationId ? { organization_id: organizationId } : undefined,
    });

    // Then fetch the paginated users
    const users = await prisma.user.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
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
            first_name: true,
            last_name: true,
            custom_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
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
            first_name: true,
            last_name: true,
            custom_id: true,
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
    const hashedPassword = await bcrypt.hash(data.generated_password || 'defaultPassword123', 10);
    
    // Get employee to determine organization
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      include: { organization: true }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Create user with employee's organization
    const userData = {
      id: generateULID(),
      email: data.email,
      password_hash: hashedPassword,
      organization_id: employee.organization_id,
      employee_id: data.employee_id,
      status: data.status || 'ACTIVE',
    };

    let user;
    try {
      user = await prisma.user.create({
        data: userData,
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
              first_name: true,
              last_name: true,
              custom_id: true,
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
    if (data.role_ids && data.role_ids.length > 0) {
      await prisma.userRole.createMany({
        data: data.role_ids.map(roleId => ({
          id: generateULID(),
          user_id: user.id,
          role_id: roleId,
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
              first_name: true,
              last_name: true,
              custom_id: true,
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
    if (data.generated_password) {
      updateData.password_hash = await bcrypt.hash(data.generated_password, 10);
      delete updateData.generated_password; // Remove this field as it's not in the schema
    } else if (data.password_hash) {
      updateData.password_hash = await bcrypt.hash(data.password_hash, 10);
    }
    
    // Remove role_ids from direct update as it needs separate handling
    const roleIds = data.role_ids;
    delete updateData.role_ids;
    
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
            first_name: true,
            last_name: true,
            custom_id: true,
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
        where: { user_id: id }
      });

      // Add new roles
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map(roleId => ({
            id: generateULID(),
            user_id: id,
            role_id: roleId,
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
              first_name: true,
              last_name: true,
              custom_id: true,
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
            first_name: true,
            last_name: true,
            custom_id: true,
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

    const isValid = await bcrypt.compare(password, user.password_hash || '');
    
    if (!isValid) {
      return null;
    }

    return user;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getById(userId);
    if (!user) return [];
    
    const roleIds = user.userRoles.map(ur => ur.role_id);
    
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role_id: {
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
