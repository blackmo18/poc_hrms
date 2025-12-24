import { getOrganizationRepository } from '@/lib/repository';
import { Organization } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OrganizationService {
  private organizationRepository = getOrganizationRepository();

  async getById(id: string): Promise<Organization | null> {
    return await this.organizationRepository.findById(id);
  }

  async getByName(name: string): Promise<Organization | null> {
    return await this.organizationRepository.findByName(name);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Organization>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      this.organizationRepository.findAll().then(results =>
        results.slice(skip, skip + limit)
      ),
      this.organizationRepository.findAll().then(results => results.length)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: organizations,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
    const id = generateULID();
    return await this.organizationRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return await this.organizationRepository.update(id, data);
  }

  async delete(id: string): Promise<Organization> {
    return await this.organizationRepository.delete(id);
  }
}

let organizationService: OrganizationService;

export function getOrganizationService(): OrganizationService {
  if (!organizationService) {
    organizationService = new OrganizationService();
  }
  return organizationService;
}
