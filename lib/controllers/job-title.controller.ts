import { prisma } from '../db';
import { CreateJobTitle, UpdateJobTitle } from '../models/job-title';
import { generateULID } from '../utils/ulid.service';

export class JobTitleController {
  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
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
      data: jobTitles,
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

  async getById(id: string) {
    return await prisma.jobTitle.findUnique({
      where: { id },
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async create(data: CreateJobTitle) {
    return await prisma.jobTitle.create({
      data: {id: generateULID(), ...data},
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async update(id: string, data: UpdateJobTitle) {
    return await prisma.jobTitle.update({
      where: { id },
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.jobTitle.delete({
      where: { id },
    });
  }
}

export const jobTitleController = new JobTitleController();
