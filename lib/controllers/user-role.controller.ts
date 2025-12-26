import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateUserRole } from '../models/user-role';

export class UserRoleController {
  async getAll() {
    return await prisma.userRole.findMany();
  }

  async getById(id: string) {
    return await prisma.userRole.findUnique({
      where: { id }
    });
  }

  async getByUserId(userId: string) {
    return await prisma.userRole.findMany({
      where: { user_id: userId }
    });
  }

  async getByRoleId(roleId: string) {
    return await prisma.userRole.findMany({
      where: { role_id: roleId }
    });
  }

  async create(data: CreateUserRole) {
    return await prisma.userRole.create({
      data: { id: generateULID(), ...data }
    });
  }

  async delete(id: string) {
    return await prisma.userRole.delete({
      where: { id }
    });
  }

  async deleteByUserAndRole(userId: string, roleId: string) {
    const result = await prisma.userRole.deleteMany({
      where: {
        user_id: userId,
        role_id: roleId
      }
    });
    return result.count;
  }
}

export const userRoleController = new UserRoleController();
