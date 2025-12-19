import { prisma } from '../db';
import { CreateJobTitle, UpdateJobTitle } from '../models/job-title';

export class JobTitleController {
  async getAll(organizationId?: number) {
    return await prisma.jobTitle.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      include: {
        organization: true,
        employees: true,
      },
    });
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

  async delete(id: number) {
    return await prisma.jobTitle.delete({
      where: { id },
    });
  }
}

export const jobTitleController = new JobTitleController();
