import { BaseRepository } from './base.repository';
import { Payroll } from '@prisma/client';

export class PayrollRepository extends BaseRepository {
  async findById(id: string): Promise<Payroll | null> {
    return this.prisma.payroll.findUnique({
      where: { id },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<Payroll[]> {
    return this.prisma.payroll.findMany({
      where: { employee_id: employeeId },
    });
  }

  async findAll(): Promise<Payroll[]> {
    return this.prisma.payroll.findMany();
  }

  async create(data: Omit<Payroll, 'created_at' | 'updated_at'>): Promise<Payroll> {
    return this.prisma.payroll.create({
      data,
    });
  }

  async update(id: string, data: Partial<Payroll>): Promise<Payroll> {
    return this.prisma.payroll.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Payroll> {
    return this.prisma.payroll.delete({
      where: { id },
    });
  }
}

let payrollRepository: PayrollRepository;

export function getPayrollRepository(): PayrollRepository {
  if (!payrollRepository) {
    payrollRepository = new PayrollRepository();
  }
  return payrollRepository;
}
