import { getUserRepository } from '@/lib/repository';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateULID } from '@/lib/utils/ulid.service';

export class UserService {
  private userRepository = getUserRepository();

  async getById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async getByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async getByOrganizationId(organizationId: string): Promise<User[]> {
    return await this.userRepository.findByOrganizationId(organizationId);
  }

  async getAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<User> {
    const id = generateULID();
    return await this.userRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return await this.userRepository.update(id, data);
  }

  async delete(id: string): Promise<User> {
    return await this.userRepository.delete(id);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return await this.userRepository.getUserPermissions(userId);
  }
}

let userService: UserService;

export function getUserService(): UserService {
  if (!userService) {
    userService = new UserService();
  }
  return userService;
}
