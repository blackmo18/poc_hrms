import { prisma } from '../db';
import { CreateOrganization, UpdateOrganization } from '../models/organization';

export class OrganizationController {
  async getAll() {
    return await prisma.organization.findMany({
      include: {
        departments: true,
        employees: true,
        admins: true,
      },
    });
  }

  async getById(id: number) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        departments: true,
        employees: {
          include: {
            department: true,
            jobTitle: true,
            manager: true,
          },
        },
        admins: true,
      },
    });
  }

  async create(data: CreateOrganization) {
    return await prisma.organization.create({
      data,
      include: {
        departments: true,
        employees: true,
        admins: true,
      },
    });
  }

  async update(id: number, data: UpdateOrganization) {
    return await prisma.organization.update({
      where: { id },
      data,
      include: {
        departments: true,
        employees: true,
        admins: true,
      },
    });
  }

  async delete(id: number) {
    return await prisma.organization.delete({
      where: { id },
    });
  }
}

export const organizationController = new OrganizationController();
