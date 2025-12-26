import { departmentController } from '@/lib/controllers/department.controller';
import { CreateDepartment, UpdateDepartment } from '@/lib/models/department';
import { Department } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class DepartmentService {
  async getById(session: any, id: string): Promise<Department | null> {
    return await departmentController.getById(session, id);
  }

  async getByOrganizationId(session: any, organizationId: string): Promise<Department[]> {
    const result = await departmentController.getAll(session, organizationId);
    return result.data;
  }

  async getAll(session: any, options?: PaginationOptions): Promise<PaginatedResponse<Department>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const result = await departmentController.getAll(session, undefined, page, limit);
    return {
      data: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages
    };
  }

  async create(session: any, data: CreateDepartment): Promise<Department> {
    return await departmentController.create(session, data);
  }

  async update(session: any, id: string, data: UpdateDepartment): Promise<Department> {
    return await departmentController.update(session, id, data);
  }

  async delete(session: any, id: string): Promise<Department> {
    return await departmentController.delete(session, id);
  }
}

let departmentService: DepartmentService;

export function getDepartmentService(): DepartmentService {
  if (!departmentService) {
    departmentService = new DepartmentService();
  }
  return departmentService;
}
