import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { CreateCompensation, UpdateCompensation } from '@/lib/models/compensation';
import { Compensation } from '@prisma/client';

export class CompensationController {
  async getAll() {
    return await prisma.compensation.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });
  }

  async getById(id: string) {
    return await prisma.compensation.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });
  }

  async findByEmployeeId(employeeId: string) {
    return await prisma.compensation.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });
  }

  async getCurrentByEmployeeId(employeeId: string) {
    const compensations = await this.findByEmployeeId(employeeId);
    return compensations[0] || null;
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
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateCompensation) {
    return await prisma.compensation.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.compensation.delete({
      where: { id },
    });
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateCompensation }>) {
    const results = await prisma.$transaction(async (tx) => {
      const updatedCompensations = [];
      
      for (const { id, data } of updates) {
        const updated = await tx.compensation.update({
          where: { id },
          data,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        });
        updatedCompensations.push(updated);
      }

      return updatedCompensations;
    });

    return results;
  }

  async getCompensationHistory(employeeId: string) {
    return await prisma.compensation.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        effectiveDate: 'asc',
      },
    });
  }
}

export const compensationController = new CompensationController();
