import { organizationController } from '@/lib/controllers/organization.controller';
import { CreateOrganization, UpdateOrganization } from '@/lib/models/organization';
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
  async getById(id: string): Promise<Organization | null> {
    return await organizationController.getById(id);
  }

  async getByName(name: string): Promise<Organization | null> {
    return await organizationController.findByName(name);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Organization>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const result = await organizationController.getAll({ page, limit });
    return {
      data: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages
    };
  }

  async create(data: CreateOrganization): Promise<Organization> {
    return await organizationController.create(data);
  }

  async update(id: string, data: UpdateOrganization): Promise<Organization> {
    return await organizationController.update(id, data);
  }

  async delete(id: string): Promise<Organization> {
    return await organizationController.delete(id);
  }
}

let organizationService: OrganizationService;

export function getOrganizationService(): OrganizationService {
  if (!organizationService) {
    organizationService = new OrganizationService();
  }
  return organizationService;
}
