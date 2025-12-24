import { BaseRepository } from './base.repository';
import { UserRole } from '@prisma/client';
import { generateULID } from '../utils/ulid.service';

export class UserRoleRepository extends BaseRepository {
  async findById(id: string): Promise<UserRole | null> {
    return this.prisma.userRole.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    return this.prisma.userRole.findMany({
      where: { user_id: userId },
    });
  }

  async findByRoleId(roleId: string): Promise<UserRole[]> {
    return this.prisma.userRole.findMany({
      where: { role_id: roleId },
    });
  }

  async findAll(): Promise<UserRole[]> {
    return this.prisma.userRole.findMany();
  }

  async create(data: Omit<UserRole, 'internal_id' | 'id' | 'created_at'>): Promise<UserRole> {
    return this.prisma.userRole.create({
      data: { id: generateULID(), ...data },
    });
  }

  async delete(id: string): Promise<UserRole> {
    return this.prisma.userRole.delete({
      where: { id },
    });
  }

  async deleteByUserAndRole(userId: string, roleId: string): Promise<number> {
    const result = await this.prisma.userRole.deleteMany({
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });
    return result.count;
  }
}

let userRoleRepository: UserRoleRepository;

export function getUserRoleRepository(): UserRoleRepository {
  if (!userRoleRepository) {
    userRoleRepository = new UserRoleRepository();
  }
  return userRoleRepository;
}
