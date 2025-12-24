import { BaseRepository } from './base.repository';
import { Employee } from '@prisma/client';

export class EmployeeRepository extends BaseRepository {
  async findById(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { user_id: userId },
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { organization_id: organizationId },
    });
  }

  async findByDepartmentId(departmentId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { department_id: departmentId },
    });
  }

  async findAll(): Promise<Employee[]> {
    return this.prisma.employee.findMany();
  }

  async create(data: Omit<Employee, 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Employee> {
    return this.prisma.employee.create({
      data,
    });
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Employee> {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}

let employeeRepository: EmployeeRepository;

export function getEmployeeRepository(): EmployeeRepository {
  if (!employeeRepository) {
    employeeRepository = new EmployeeRepository();
  }
  return employeeRepository;
}
