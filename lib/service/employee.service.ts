import { employeeController } from '@/lib/controllers/employee.controller';
import { CreateEmployee, UpdateEmployee } from '@/lib/models/employee';
import { Employee } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class EmployeeService {
  async getById(id: string): Promise<Employee | null> {
    return await employeeController.getById(id);
  }

  async getByUserId(userId: string): Promise<Employee | null> {
    return await employeeController.getByUserId(userId);
  }

  async getByOrganizationId(organizationId: string): Promise<Employee[]> {
    const result = await employeeController.getAll(organizationId);
    return result.data;
  }

  async getByDepartmentId(departmentId: string): Promise<Employee[]> {
    return await employeeController.getByDepartment(departmentId);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Employee>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const result = await employeeController.getAll(undefined, { page, limit });
    return {
      data: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages
    };
  }

  async create(data: CreateEmployee): Promise<Employee> {
    return await employeeController.create(data);
  }

  async update(id: string, data: UpdateEmployee): Promise<Employee> {
    return await employeeController.update(id, data);
  }

  async delete(id: string): Promise<Employee> {
    return await employeeController.delete(id);
  }
}

let employeeService: EmployeeService;

export function getEmployeeService(): EmployeeService {
  if (!employeeService) {
    employeeService = new EmployeeService();
  }
  return employeeService;
}
