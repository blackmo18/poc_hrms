import { BaseRepository } from './base.repository';
import { User } from '@prisma/client';

export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByOrganizationId(organizationId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { organization_id: organizationId },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async create(data: Omit<User, 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userRoles: {
          select: {
            role: {
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
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rolePermission => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissions);
  }
}

let userRepository: UserRepository;

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = new UserRepository();
  }
  return userRepository;
}
