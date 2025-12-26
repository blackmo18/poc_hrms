import { jobTitleController } from '@/lib/controllers/job-title.controller';
import { CreateJobTitle, UpdateJobTitle } from '@/lib/models/job-title';
import { JobTitle } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class JobTitleService {
  async getById(id: string): Promise<JobTitle | null> {
    return await jobTitleController.getById(id);
  }

  async getByOrganizationId(organizationId: string): Promise<JobTitle[]> {
    const result = await jobTitleController.getAll(organizationId);
    return result.data;
  }

  async getAll(): Promise<JobTitle[]> {
    const result = await jobTitleController.getAll();
    return result.data;
  }

  async create(data: CreateJobTitle): Promise<JobTitle> {
    return await jobTitleController.create(data);
  }

  async update(id: string, data: UpdateJobTitle): Promise<JobTitle> {
    return await jobTitleController.update(id, data);
  }

  async delete(id: string): Promise<JobTitle> {
    return await jobTitleController.delete(id);
  }
}

let jobTitleService: JobTitleService;

export function getJobTitleService(): JobTitleService {
  if (!jobTitleService) {
    jobTitleService = new JobTitleService();
  }
  return jobTitleService;
}
