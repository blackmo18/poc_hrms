import { BaseRepository } from './base.repository';
import { JobTitle } from '@prisma/client';

export class JobTitleRepository extends BaseRepository {
  async findById(id: string): Promise<JobTitle | null> {
    return this.prisma.jobTitle.findUnique({
      where: { id },
    });
  }

  async findByOrganizationId(organizationId: string): Promise<JobTitle[]> {
    return this.prisma.jobTitle.findMany({
      where: { organization_id: organizationId },
    });
  }

  async findAll(): Promise<JobTitle[]> {
    return this.prisma.jobTitle.findMany();
  }

  async create(data: Omit<JobTitle, 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<JobTitle> {
    return this.prisma.jobTitle.create({
      data,
    });
  }

  async update(id: string, data: Partial<JobTitle>): Promise<JobTitle> {
    return this.prisma.jobTitle.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<JobTitle> {
    return this.prisma.jobTitle.delete({
      where: { id },
    });
  }
}

let jobTitleRepository: JobTitleRepository;

export function getJobTitleRepository(): JobTitleRepository {
  if (!jobTitleRepository) {
    jobTitleRepository = new JobTitleRepository();
  }
  return jobTitleRepository;
}
