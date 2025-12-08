import { prisma } from '../db';
import { CreateDepartment, UpdateDepartment } from '../models/department';

export class DepartmentController {
  async getAll(organizationId?: bigint) {
    return await prisma.department.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      include: {
        organization: true,
        employees: {
          include: {
            jobTitle: true,
          },
        },
      },
    });
  }

  async getById(id: bigint) {
    return await prisma.department.findUnique({
      where: { id },
      include: {
        organization: true,
        employees: {
          include: {
            jobTitle: true,
            manager: true,
          },
        },
      },
    });
  }

  async create(data: CreateDepartment) {
    return await prisma.department.create({
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async update(id: bigint, data: UpdateDepartment) {
    return await prisma.department.update({
      where: { id },
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async delete(id: bigint) {
    return await prisma.department.delete({
      where: { id },
    });
  }
}

export const departmentController = new DepartmentController();
