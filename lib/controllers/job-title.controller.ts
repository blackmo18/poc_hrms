import { prisma } from '../db';
import { CreateJobTitle, UpdateJobTitle } from '../models/job-title';

export class JobTitleController {
  async getAll(organizationId?: number, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.jobTitle.count({
      where: organizationId ? { organization_id: organizationId } : undefined,
    });

    // Then fetch the paginated job titles
    const jobTitles = await prisma.jobTitle.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      skip,
      take: limit,
      include: {
        organization: true,
        employees: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return {
      data: jobTitles.map(jt => ({
        id: jt.public_id,
        organization: {
          id: jt.organization.public_id,
          name: jt.organization.name,
        },
        name: jt.name,
        description: jt.description,
        employees: jt.employees.map(emp => ({
          id: emp.public_id,
          first_name: emp.first_name,
          last_name: emp.last_name,
        })),
        created_at: jt.created_at,
        updated_at: jt.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: number) {
    return await prisma.jobTitle.findUnique({
      where: { id },
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async getByPublicId(public_id: string) {
    const jt = await prisma.jobTitle.findUnique({
      where: { public_id },
      include: {
        organization: true,
        employees: true,
      },
    });

    if (!jt) return null;

    return {
      id: jt.public_id,
      organization: {
        id: jt.organization.public_id,
        name: jt.organization.name,
      },
      name: jt.name,
      description: jt.description,
      created_at: jt.created_at,
      updated_at: jt.updated_at,
    };
  }

  async create(data: CreateJobTitle) {
    return await prisma.jobTitle.create({
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async update(id: number, data: UpdateJobTitle) {
    return await prisma.jobTitle.update({
      where: { id },
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async updateByPublicId(public_id: string, data: UpdateJobTitle) {
    return await prisma.jobTitle.update({
      where: { public_id },
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async delete(id: number) {
    return await prisma.jobTitle.delete({
      where: { id },
    });
  }

  async deleteByPublicId(public_id: string) {
    return await prisma.jobTitle.delete({
      where: { public_id },
    });
  }
}

export const jobTitleController = new JobTitleController();
