import { PrismaClient, SSSContribution } from '@prisma/client';
import { BasePrismaController } from '../../interfaces/base-prisma-controller.interface';

/**
 * Interface for SSS controller
 */
export interface ISSSPrismaController {
  // Basic CRUD
  create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    employeeRate: number;
    employerRate: number;
    ecRate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<SSSContribution>;
  
  findById(id: string): Promise<SSSContribution | null>;
  findMany(organizationId: string, filter?: {
    effectiveDate?: Date;
    minSalary?: number;
    maxSalary?: number;
  }): Promise<SSSContribution[]>;
  
  update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    employeeRate?: number;
    employerRate?: number;
    ecRate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<SSSContribution>;
  
  delete(id: string): Promise<SSSContribution>;
  
  // Query methods
  findApplicableRate(
    organizationId: string,
    salary: number,
    date?: Date
  ): Promise<SSSContribution | null>;
  
  findRatesByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SSSContribution[]>;
  
  findMaximumSalaryRate(
    organizationId: string,
    date?: Date
  ): Promise<SSSContribution | null>;
  
  // Bulk operations
  bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
      ecRate: number;
    }>
  ): Promise<{ count: number }>;
}

/**
 * SSS Prisma Controller Implementation
 * Handles all database operations for SSS contributions
 */
export class SSSPrismaController 
  extends BasePrismaController<SSSContribution, any, any>
  implements ISSSPrismaController {
  
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    employeeRate: number;
    employerRate: number;
    ecRate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<SSSContribution> {
    return await this.prisma.sSSContribution.create({
      data: data as any, // Type assertion to bypass Prisma type generation issue
    });
  }

  async findById(id: string): Promise<SSSContribution | null> {
    return await this.prisma.sSSContribution.findUnique({
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
  ): Promise<SSSContribution[]> {
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

    return await this.prisma.sSSContribution.findMany({
      where,
      orderBy: { minSalary: 'asc' },
    });
  }

  async update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    employeeRate?: number;
    employerRate?: number;
    ecRate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<SSSContribution> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'SSSContribution');
    }

    return await this.prisma.sSSContribution.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SSSContribution> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'SSSContribution');
    }

    return await this.prisma.sSSContribution.delete({
      where: { id },
    });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return await this.prisma.sSSContribution.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateMany(filter: any, data: any): Promise<{ count: number }> {
    return await this.prisma.sSSContribution.updateMany({
      where: filter,
      data,
    });
  }

  async deleteMany(filter: any): Promise<{ count: number }> {
    return await this.prisma.sSSContribution.deleteMany({
      where: filter,
    });
  }

  /**
   * Find the applicable SSS rate for a given salary and date
   */
  async findApplicableRate(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<SSSContribution | null> {
    return await this.prisma.sSSContribution.findFirst({
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
  ): Promise<SSSContribution[]> {
    return await this.prisma.sSSContribution.findMany({
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
   * Find the rate for maximum salary (for salary cap calculations)
   */
  async findMaximumSalaryRate(
    organizationId: string,
    date: Date = new Date()
  ): Promise<SSSContribution | null> {
    return await this.prisma.sSSContribution.findFirst({
      where: {
        organizationId,
        effectiveFrom: { lte: date },
        maxSalary: null, // This indicates the highest bracket
        AND: [
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }] },
        ],
      },
      orderBy: { minSalary: 'desc' },
    });
  }

  /**
   * Bulk update SSS rates for multiple brackets
   */
  async bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
      ecRate: number;
    }>
  ): Promise<{ count: number }> {
    return await this.transaction(async (tx) => {
      let count = 0;
      
      for (const update of updates) {
        // Verify rate belongs to organization
        const rate = await tx.sSSContribution.findFirst({
          where: { id: update.id, organizationId },
        });
        
        if (rate) {
          await tx.sSSContribution.update({
            where: { id: update.id },
            data: {
              employeeRate: update.employeeRate,
              employerRate: update.employerRate,
              ecRate: update.ecRate,
            },
          });
          count++;
        }
      }
      
      return { count };
    });
  }
}
