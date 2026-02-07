import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateCompensation, UpdateCompensation } from '@/lib/models/compensation';
import { Compensation } from '@prisma/client';

export class CompensationController {
  async getAll() {
    return await prisma.compensation.findMany();
  }

  async getById(id: string) {
    return await prisma.compensation.findUnique({
      where: { id }
    });
  }

  async findByEmployeeId(employeeId: string) {
    return await prisma.compensation.findMany({
      where: { employeeId }
    });
  }

  async create(data: CreateCompensation) {
    return await prisma.compensation.create({
      data: {
        id: generateULID(),
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        baseSalary: data.baseSalary,
        payFrequency: data.payFrequency,
        effectiveDate: data.effectiveDate,
      } as any
    });
  }

  async update(id: string, data: UpdateCompensation) {
    return await prisma.compensation.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await prisma.compensation.delete({
      where: { id }
    });
  }
}

export const compensationController = new CompensationController();
