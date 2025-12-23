import { BaseRepository } from './base.repository';
import { Department } from '@prisma/client';

export class DepartmentRepository extends BaseRepository {
  async findById(id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { id },
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { organization_id: organizationId },
    });
  }

  async findAll(): Promise<Department[]> {
    return this.prisma.department.findMany();
  }

  async create(data: Omit<Department, 'created_at' | 'updated_at'>): Promise<Department> {
    return this.prisma.department.create({
      data,
    });
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Department> {
    return this.prisma.department.delete({
      where: { id },
    });
  }
}

let departmentRepository: DepartmentRepository;

export function getDepartmentRepository(): DepartmentRepository {
  if (!departmentRepository) {
    departmentRepository = new DepartmentRepository();
  }
  return departmentRepository;
}
