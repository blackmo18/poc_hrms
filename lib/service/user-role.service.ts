import { getUserRoleRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { UserRole } from '@prisma/client';

export class UserRoleService {
  private userRoleRepository = getUserRoleRepository();

  async getById(id: string): Promise<UserRole | null> {
    return await this.userRoleRepository.findById(id);
  }

  async getByUserId(userId: string): Promise<UserRole[]> {
    return await this.userRoleRepository.findByUserId(userId);
  }

  async getByRoleId(roleId: string): Promise<UserRole[]> {
    return await this.userRoleRepository.findByRoleId(roleId);
  }

  async getAll(): Promise<UserRole[]> {
    return await this.userRoleRepository.findAll();
  }

  async create(data: Omit<UserRole, 'internal_id' | 'id' | 'created_at'>): Promise<UserRole> {
    return await this.userRoleRepository.create(data);
  }

  async delete(id: string): Promise<UserRole> {
    return await this.userRoleRepository.delete(id);
  }

  async deleteByUserAndRole(userId: string, roleId: string): Promise<number> {
    return this.userRoleRepository.deleteByUserAndRole(userId, roleId);
  }
}

let userRoleService: UserRoleService;

export function getUserRoleService(): UserRoleService {
  if (!userRoleService) {
    userRoleService = new UserRoleService();
  }
  return userRoleService;
}
