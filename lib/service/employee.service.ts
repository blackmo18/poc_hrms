import { getEmployeeRepository } from '@/lib/repository';
import { Employee } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class EmployeeService {
  private employeeRepository = getEmployeeRepository();

  async getById(id: string): Promise<Employee | null> {
    return await this.employeeRepository.findById(id);
  }

  async getByUserId(userId: string): Promise<Employee | null> {
    return await this.employeeRepository.findByUserId(userId);
  }

  async getByOrganizationId(organizationId: string): Promise<Employee[]> {
    return await this.employeeRepository.findByOrganizationId(organizationId);
  }

  async getByDepartmentId(departmentId: string): Promise<Employee[]> {
    return await this.employeeRepository.findByDepartmentId(departmentId);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Employee>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      this.employeeRepository.findAll().then(results =>
        results.slice(skip, skip + limit)
      ),
      this.employeeRepository.findAll().then(results => results.length)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: employees,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Employee> {
    const id = generateULID();
    return await this.employeeRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return await this.employeeRepository.update(id, data);
  }

  async delete(id: string): Promise<Employee> {
    return await this.employeeRepository.delete(id);
  }
}

let employeeService: EmployeeService;

export function getEmployeeService(): EmployeeService {
  if (!employeeService) {
    employeeService = new EmployeeService();
  }
  return employeeService;
}
