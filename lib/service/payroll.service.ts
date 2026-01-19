import { payrollController } from '@/lib/controllers/payroll.controller';
import { CreatePayroll, UpdatePayroll } from '@/lib/models/payroll';
import { Payroll } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class PayrollService {
  async getById(id: string): Promise<Payroll | null> {
    return await payrollController.getById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<Payroll[]> {
    const result = await payrollController.getAll();
    return result.filter(p => p.employeeId === employeeId);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Payroll>> {
    const result = await payrollController.getAll();
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: CreatePayroll): Promise<Payroll> {
    return await payrollController.create(data);
  }

  async update(id: string, data: UpdatePayroll): Promise<Payroll> {
    return await payrollController.update(id, data);
  }

  async delete(id: string): Promise<Payroll> {
    return await payrollController.delete(id);
  }
}

let payrollService: PayrollService;

export function getPayrollService(): PayrollService {
  if (!payrollService) {
    payrollService = new PayrollService();
  }
  return payrollService;
}
