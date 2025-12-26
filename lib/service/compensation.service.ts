import { compensationController } from '@/lib/controllers/compensation.controller';
import { CreateCompensation, UpdateCompensation } from '../models/compensation';
import { Compensation } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class CompensationService {
  async getById(id: string): Promise<Compensation | null> {
    return await compensationController.getById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<Compensation[]> {
    const result = await compensationController.getAll();
    return result.filter(c => c.employee_id === employeeId);
  }

  async getAll(): Promise<Compensation[]> {
    return await compensationController.getAll();
  }

  async create(data: CreateCompensation): Promise<Compensation> {
    return await compensationController.create(data);
  }

  async update(id: string, data: UpdateCompensation): Promise<Compensation> {
    return await compensationController.update(id, data);
  }

  async delete(id: string): Promise<Compensation> {
    return await compensationController.delete(id);
  }
}

let compensationService: CompensationService;

export function getCompensationService(): CompensationService {
  if (!compensationService) {
    compensationService = new CompensationService();
  }
  return compensationService;
}
