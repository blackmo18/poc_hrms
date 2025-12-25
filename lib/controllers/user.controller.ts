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
        organization: true,
        employee: true,
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

  async create(data: CreateUser) {
    const hashedPassword = await bcrypt.hash(data.password_hash, 10);
    
    return await prisma.user.create({
      data: {
        id: generateULID(),
        ...data,
        password_hash: hashedPassword,
      },
      include: {
        organization: true,
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateUser) {
    let updateData = { ...data };
    
    if (data.password_hash) {
      updateData.password_hash = await bcrypt.hash(data.password_hash, 10);
    }
    
    return await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
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
        organization: true,
        employee: true,
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
}

export const userController = new UserController();
