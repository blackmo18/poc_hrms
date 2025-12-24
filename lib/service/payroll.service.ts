import { getPayrollRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { Payroll } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';

export class PayrollService {
  private payrollRepository = getPayrollRepository();

  async getById(id: string): Promise<Payroll | null> {
    return await this.payrollRepository.findById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<Payroll[]> {
    return await this.payrollRepository.findByEmployeeId(employeeId);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Payroll>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [payrolls, total] = await Promise.all([
      this.payrollRepository.findAll().then(results =>
        results.slice(skip, skip + limit)
      ),
      this.payrollRepository.findAll().then(results => results.length)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payrolls,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Promise<Payroll> {
    const id = generateULID();
    return await this.payrollRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<Payroll>): Promise<Payroll> {
    return await this.payrollRepository.update(id, data);
  }

  async delete(id: string): Promise<Payroll> {
    return await this.payrollRepository.delete(id);
  }
}

let payrollService: PayrollService;

export function getPayrollService(): PayrollService {
  if (!payrollService) {
    payrollService = new PayrollService();
  }
  return payrollService;
}
