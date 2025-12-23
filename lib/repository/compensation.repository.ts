import { BaseRepository } from './base.repository';
import { Compensation } from '@prisma/client';
import { generateULID } from '../utils/ulid.service';

export class CompensationRepository extends BaseRepository {
  async findById(id: string): Promise<Compensation | null> {
    return this.prisma.compensation.findUnique({
      where: { id },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<Compensation[]> {
    return this.prisma.compensation.findMany({
      where: { employee_id: employeeId },
    });
  }

  async findAll(): Promise<Compensation[]> {
    return this.prisma.compensation.findMany();
  }

  async create(data: Omit<Compensation, 'internal_id' | 'id' | 'created_at'>): Promise<Compensation> {
    return this.prisma.compensation.create({
      data: { id: generateULID(), ...data },
    });
  }

  async update(id: string, data: Partial<Compensation>): Promise<Compensation> {
    return this.prisma.compensation.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Compensation> {
    return this.prisma.compensation.delete({
      where: { id },
    });
  }
}

let compensationRepository: CompensationRepository;

export function getCompensationRepository(): CompensationRepository {
  if (!compensationRepository) {
    compensationRepository = new CompensationRepository();
  }
  return compensationRepository;
}
