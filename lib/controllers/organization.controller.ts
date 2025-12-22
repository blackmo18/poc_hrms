import { prisma } from '../db';
import { CreateOrganization, UpdateOrganization } from '../models/organization';

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
      data: organizations.map(org => ({
        id: org.public_id,
        name: org.name,
        email: org.email,
        contact_number: org.contact_number,
        address: org.address,
        logo: org.logo,
        website: org.website,
        description: org.description,
        status: org.status,
        created_at: org.created_at,
        updated_at: org.updated_at,
      })),
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

  async getByPublicId(public_id: string) {
    const org = await prisma.organization.findUnique({
      where: { public_id },
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

    if (!org) return null;

    return {
      id: org.public_id,
      name: org.name,
      email: org.email,
      contact_number: org.contact_number,
      address: org.address,
      logo: org.logo,
      website: org.website,
      description: org.description,
      status: org.status,
      created_at: org.created_at,
      updated_at: org.updated_at,
      departments: org.departments.map(d => ({
        id: d.public_id,
        name: d.name,
        description: d.description,
      })),
      employees: org.employees.map(e => ({
        id: e.public_id,
        first_name: e.first_name,
        last_name: e.last_name,
        email: e.email,
        employment_status: e.employment_status,
      })),
      admins: org.admins.map(a => ({
        id: a.public_id,
      })),
    };
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

  async updateByPublicId(public_id: string, data: UpdateOrganization) {
    return await prisma.organization.update({
      where: { public_id },
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

  async deleteByPublicId(public_id: string) {
    return await prisma.organization.delete({
      where: { public_id },
    });
  }
}

export const organizationController = new OrganizationController();
