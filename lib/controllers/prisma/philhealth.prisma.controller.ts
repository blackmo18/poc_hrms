import { PrismaClient, PhilhealthContribution } from '@prisma/client';
import { BasePrismaController } from '../../interfaces/base-prisma-controller.interface';

/**
 * Interface for Philhealth controller
 */
export interface IPhilhealthPrismaController {
  // Basic CRUD
  create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    employeeRate: number;
    employerRate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<PhilhealthContribution>;
  
  findById(id: string): Promise<PhilhealthContribution | null>;
  findMany(organizationId: string, filter?: {
    effectiveDate?: Date;
    minSalary?: number;
    maxSalary?: number;
  }): Promise<PhilhealthContribution[]>;
  
  update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    employeeRate?: number;
    employerRate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<PhilhealthContribution>;
  
  delete(id: string): Promise<PhilhealthContribution>;
  
  // Query methods
  findApplicableRate(
    organizationId: string,
    salary: number,
    date?: Date
  ): Promise<PhilhealthContribution | null>;
  
  findRatesByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PhilhealthContribution[]>;
  
  // Bulk operations
  bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
    }>
  ): Promise<{ count: number }>;
}

/**
 * Philhealth Prisma Controller Implementation
 * Handles all database operations for Philhealth contributions
 */
export class PhilhealthPrismaController 
  extends BasePrismaController<PhilhealthContribution, any, any>
  implements IPhilhealthPrismaController {
  
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    employeeRate: number;
    employerRate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<PhilhealthContribution> {
    return await this.prisma.philhealthContribution.create({
      data: data as any, // Type assertion to bypass Prisma type generation issue
    });
  }

  async findById(id: string): Promise<PhilhealthContribution | null> {
    return await this.prisma.philhealthContribution.findUnique({
      where: { id },
    });
  }

  async findMany(
    organizationId: string,
    filter?: {
      effectiveDate?: Date;
      minSalary?: number;
      maxSalary?: number;
    }
  ): Promise<PhilhealthContribution[]> {
    const where: any = { organizationId };

    if (filter?.effectiveDate) {
      where.effectiveFrom = { lte: filter.effectiveDate };
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gte: filter.effectiveDate } },
      ];
    }

    if (filter?.minSalary !== undefined) {
      where.minSalary = { gte: filter.minSalary };
    }

    if (filter?.maxSalary !== undefined) {
      where.maxSalary = { lte: filter.maxSalary };
    }

    return await this.prisma.philhealthContribution.findMany({
      where,
      orderBy: { minSalary: 'asc' },
    });
  }

  async update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    employeeRate?: number;
    employerRate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<PhilhealthContribution> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'PhilhealthContribution');
    }

    return await this.prisma.philhealthContribution.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PhilhealthContribution> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'PhilhealthContribution');
    }

    return await this.prisma.philhealthContribution.delete({
      where: { id },
    });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return await this.prisma.philhealthContribution.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateMany(filter: any, data: any): Promise<{ count: number }> {
    return await this.prisma.philhealthContribution.updateMany({
      where: filter,
      data,
    });
  }

  async deleteMany(filter: any): Promise<{ count: number }> {
    return await this.prisma.philhealthContribution.deleteMany({
      where: filter,
    });
  }

  /**
   * Find the applicable Philhealth rate for a given salary and date
   */
  async findApplicableRate(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<PhilhealthContribution | null> {
    return await this.prisma.philhealthContribution.findFirst({
      where: {
        organizationId,
        effectiveFrom: { lte: date },
        minSalary: { lte: salary },
        AND: [
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }] },
          { OR: [{ maxSalary: null }, { maxSalary: { gte: salary } }] },
        ],
      },
      orderBy: { minSalary: 'desc' },
    });
  }

  /**
   * Find all rates effective within a date range
   */
  async findRatesByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PhilhealthContribution[]> {
    return await this.prisma.philhealthContribution.findMany({
      where: {
        organizationId,
        OR: [
          {
            AND: [
              { effectiveFrom: { lte: endDate } },
              {
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: startDate } },
                ],
              },
            ],
          },
          {
            AND: [
              { effectiveFrom: { gte: startDate } },
              { effectiveFrom: { lte: endDate } },
            ],
          },
        ],
      },
      orderBy: [
        { effectiveFrom: 'asc' },
        { minSalary: 'asc' },
      ],
    });
  }

  /**
   * Bulk update Philhealth rates for multiple brackets
   */
  async bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
    }>
  ): Promise<{ count: number }> {
    return await this.transaction(async (tx) => {
      let count = 0;
      
      for (const update of updates) {
        // Verify rate belongs to organization
        const rate = await tx.philhealthContribution.findFirst({
          where: { id: update.id, organizationId },
        });
        
        if (rate) {
          await tx.philhealthContribution.update({
            where: { id: update.id },
            data: {
              employeeRate: update.employeeRate,
              employerRate: update.employerRate,
            },
          });
          count++;
        }
      }
      
      return { count };
    });
  }
}
