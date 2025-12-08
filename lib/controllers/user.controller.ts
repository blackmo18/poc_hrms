import { prisma } from '../db';
import { CreateUser, UpdateUser } from '../models/user';
import bcrypt from 'bcryptjs';

export class UserController {
  async getAll(organizationId?: number) {
    return await prisma.user.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
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

  async getById(id: number) {
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

  async update(id: number, data: UpdateUser) {
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

  async delete(id: number) {
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
