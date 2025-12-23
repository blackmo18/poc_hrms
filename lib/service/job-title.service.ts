import { getJobTitleRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { JobTitle } from '@prisma/client';

export class JobTitleService {
  private jobTitleRepository = getJobTitleRepository();

  async getById(id: string): Promise<JobTitle | null> {
    return await this.jobTitleRepository.findById(id);
  }

  async getByOrganizationId(organizationId: string): Promise<JobTitle[]> {
    return this.jobTitleRepository.findByOrganizationId(organizationId);
  }

  async getAll(): Promise<JobTitle[]> {
    return this.jobTitleRepository.findAll()
  }

  async create(data: Omit<JobTitle, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<JobTitle> {
    const id = generateULID();
    return await this.jobTitleRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<JobTitle>): Promise<JobTitle> {
    return await this.jobTitleRepository.update(id, data);
  }

  async delete(id: string): Promise<JobTitle> {
    return await this.jobTitleRepository.delete(id);
  }
}

let jobTitleService: JobTitleService;

export function getJobTitleService(): JobTitleService {
  if (!jobTitleService) {
    jobTitleService = new JobTitleService();
  }
  return jobTitleService;
}
