import { prisma } from '../db';
import { CreateOrganization, UpdateOrganization } from '../models/organization';
import { generateULID } from '../utils/ulid.service';

export class OrganizationController {
  async getAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.organization.count();

    // Then fetch the paginated organizations
    const organizations = await prisma.organization.findMany({
      skip,
      take: limit,
      include: {
        departments: false,
        employees: false,
        admins: false,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getById(id: string) {
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
      data: {id: generateULID(), ...data},
      include: {
        departments: true,
        employees: true,
        admins: true,
      },
    });
  }

  async update(id: string, data: UpdateOrganization) {
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

  async delete(id: string) {
    return await prisma.organization.delete({
      where: { id },
    });
  }

  // Simple repository method for internal use
  async findByName(name: string) {
    return await prisma.organization.findFirst({
      where: { name }
    });
  }
}

export const organizationController = new OrganizationController();
