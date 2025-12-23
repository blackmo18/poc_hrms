import { getCompensationRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { Compensation } from '@prisma/client';

export class CompensationService {
  private compensationRepository = getCompensationRepository();

  async getById(id: string): Promise<Compensation | null> {
    return await this.compensationRepository.findById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<Compensation[]> {
    return await this.compensationRepository.findByEmployeeId(employeeId);
  }

  async getAll(): Promise<Compensation[]> {
    return await this.compensationRepository.findAll();
  }

  async create(data: Omit<Compensation, 'internal_id' | 'id' | 'created_at'>): Promise<Compensation> {
    return await this.compensationRepository.create(data);
  }

  async update(id: string, data: Partial<Compensation>): Promise<Compensation> {
    return await this.compensationRepository.update(id, data);
  }

  async delete(id: string): Promise<Compensation> {
    return await this.compensationRepository.delete(id);
  }
}

let compensationService: CompensationService;

export function getCompensationService(): CompensationService {
  if (!compensationService) {
    compensationService = new CompensationService();
  }
  return compensationService;
}
