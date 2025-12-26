import { userController } from '@/lib/controllers/user.controller';
import { CreateUser, UpdateUser } from '../models/user';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateULID } from '@/lib/utils/ulid.service';

export class UserService {
  async getById(id: string): Promise<User | null> {
    return await userController.getById(id);
  }

  async getByEmail(email: string): Promise<User | null> {
    return await userController.getByEmail(email);
  }

  async getByOrganizationId(organizationId: string, options?: { page?: number; limit?: number }): Promise<User[]> {
    const result = await userController.getAll(organizationId, options);
    return result.data;
  }

  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
    const result = await userController.getAll(organizationId, options);
    return result;
  }

  async create(data: CreateUser): Promise<User> {
    return await userController.create(data);
  }

  async update(id: string, data: UpdateUser): Promise<User> {
    return await userController.update(id, data);
  }

  async delete(id: string): Promise<User> {
    return await userController.delete(id);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return await userController.getUserPermissions(userId);
  }
}

let userService: UserService;

export function getUserService(): UserService {
  if (!userService) {
    userService = new UserService();
  }
  return userService;
}
