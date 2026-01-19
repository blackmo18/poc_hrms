import { OrganizationStatus } from '@prisma/client';
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
        createdAt: 'desc'
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
    const status = this.normalizeStatus(data.status);
    return await prisma.organization.create({
      data: {
        id: generateULID(),
        name: data.name,
        status: status ?? OrganizationStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        departments: true,
        employees: true,
        admins: true,
      },
    });
  }

  async update(id: string, data: UpdateOrganization) {
    const status = this.normalizeStatus(data.status);
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (status !== undefined) updateData.status = status;

    return await prisma.organization.update({
      where: { id },
      data: updateData,
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

  private normalizeStatus(status?: string) {
    if (!status) return undefined;
    const allowed = new Set<OrganizationStatus>([
      OrganizationStatus.ACTIVE,
      OrganizationStatus.SUSPENDED,
      OrganizationStatus.CLOSED,
    ]);
    const normalized = status.toUpperCase() as OrganizationStatus;
    return allowed.has(normalized) ? normalized : undefined;
  }
}

export const organizationController = new OrganizationController();
