import { PrismaClient, PagibigContribution } from '@prisma/client';
import { BasePrismaController } from '../../interfaces/base-prisma-controller.interface';

/**
 * Interface for Pagibig controller
 */
export interface IPagibigPrismaController {
  // Basic CRUD
  create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    employeeRate: number;
    employerRate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<PagibigContribution>;
  
  findById(id: string): Promise<PagibigContribution | null>;
  findMany(organizationId: string, filter?: {
    effectiveDate?: Date;
    minSalary?: number;
    maxSalary?: number;
  }): Promise<PagibigContribution[]>;
  
  update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    employeeRate?: number;
    employerRate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<PagibigContribution>;
  
  delete(id: string): Promise<PagibigContribution>;
  
  // Query methods
  findApplicableRate(
    organizationId: string,
    salary: number,
    date?: Date
  ): Promise<PagibigContribution | null>;
  
  findRatesByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PagibigContribution[]>;
  
  findMaximumContribution(
    organizationId: string,
    date?: Date
  ): Promise<number>;
  
  // Bulk operations
  bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
      maximumContribution?: number;
    }>
  ): Promise<{ count: number }>;
}

/**
 * Pagibig Prisma Controller Implementation
 * Handles all database operations for Pagibig contributions
 */
export class PagibigPrismaController 
  extends BasePrismaController<PagibigContribution, any, any>
  implements IPagibigPrismaController {
  
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    employeeRate: number;
    employerRate: number;
    maximumContribution?: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<PagibigContribution> {
    return await this.prisma.pagibigContribution.create({
      data: data as any, // Type assertion to bypass Prisma type generation issue
    });
  }

  async findById(id: string): Promise<PagibigContribution | null> {
    return await this.prisma.pagibigContribution.findUnique({
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
  ): Promise<PagibigContribution[]> {
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

    return await this.prisma.pagibigContribution.findMany({
      where,
      orderBy: { minSalary: 'asc' },
    });
  }

  async update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    employeeRate?: number;
    employerRate?: number;
    maximumContribution?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<PagibigContribution> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'PagibigContribution');
    }

    return await this.prisma.pagibigContribution.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PagibigContribution> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'PagibigContribution');
    }

    return await this.prisma.pagibigContribution.delete({
      where: { id },
    });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return await this.prisma.pagibigContribution.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateMany(filter: any, data: any): Promise<{ count: number }> {
    return await this.prisma.pagibigContribution.updateMany({
      where: filter,
      data,
    });
  }

  async deleteMany(filter: any): Promise<{ count: number }> {
    return await this.prisma.pagibigContribution.deleteMany({
      where: filter,
    });
  }

  /**
   * Find the applicable Pagibig rate for a given salary and date
   */
  async findApplicableRate(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<PagibigContribution | null> {
    return await this.prisma.pagibigContribution.findFirst({
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
  ): Promise<PagibigContribution[]> {
    return await this.prisma.pagibigContribution.findMany({
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
   * Get the maximum contribution limit for Pagibig
   * Note: This is a fixed value (₱100) as per Philippine law
   */
  async findMaximumContribution(
    organizationId: string,
    date: Date = new Date()
  ): Promise<number> {
    // Pagibig maximum contribution is fixed at ₱100 per month
    // This is enforced by law and doesn't change per organization
    return 100;
  }

  /**
   * Bulk update Pagibig rates for multiple brackets
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
        const rate = await tx.pagibigContribution.findFirst({
          where: { id: update.id, organizationId },
        });
        
        if (rate) {
          await tx.pagibigContribution.update({
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
