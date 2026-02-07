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
      where: { userId: userId }
    });
  }

  async getByRoleId(roleId: string) {
    return await prisma.userRole.findMany({
      where: { roleId: roleId }
    });
  }

  async create(data: CreateUserRole) {
    return await prisma.userRole.create({
      data: { id: generateULID(), ...data } as any
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
        userId: userId,
        roleId: roleId
      }
    });
    return result.count;
  }
}

export const userRoleController = new UserRoleController();
