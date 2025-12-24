import { getDepartmentRepository } from '@/lib/repository';
import { Department } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class DepartmentService {
  private departmentRepository = getDepartmentRepository();

  async getById(id: string): Promise<Department | null> {
    return await this.departmentRepository.findById(id);
  }

  async getByOrganizationId(organizationId: string): Promise<Department[]> {
    return await this.departmentRepository.findByOrganizationId(organizationId);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Department>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      this.departmentRepository.findAll().then(results =>
        results.slice(skip, skip + limit)
      ),
      this.departmentRepository.findAll().then(results => results.length)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: departments,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const id = generateULID();
    return await this.departmentRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    return await this.departmentRepository.update(id, data);
  }

  async delete(id: string): Promise<Department> {
    return await this.departmentRepository.delete(id);
  }
}

let departmentService: DepartmentService;

export function getDepartmentService(): DepartmentService {
  if (!departmentService) {
    departmentService = new DepartmentService();
  }
  return departmentService;
}
