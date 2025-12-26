import { userRoleController } from '@/lib/controllers/user-role.controller';
import { CreateUserRole } from '@/lib/models/user-role';
import { UserRole } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class UserRoleService {
  async getById(id: string): Promise<UserRole | null> {
    return await userRoleController.getById(id);
  }

  async getByUserId(userId: string): Promise<UserRole[]> {
    return await userRoleController.getByUserId(userId);
  }

  async getByRoleId(roleId: string): Promise<UserRole[]> {
    return await userRoleController.getByRoleId(roleId);
  }

  async getAll(): Promise<UserRole[]> {
    return await userRoleController.getAll();
  }

  async create(data: CreateUserRole): Promise<UserRole> {
    return await userRoleController.create(data);
  }

  async delete(id: string): Promise<UserRole> {
    return await userRoleController.delete(id);
  }

  async deleteByUserAndRole(userId: string, roleId: string): Promise<number> {
    return await userRoleController.deleteByUserAndRole(userId, roleId);
  }
}

let userRoleService: UserRoleService;

export function getUserRoleService(): UserRoleService {
  if (!userRoleService) {
    userRoleService = new UserRoleService();
  }
  return userRoleService;
}
