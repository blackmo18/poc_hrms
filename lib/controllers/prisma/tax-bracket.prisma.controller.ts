import { PrismaClient, TaxBracket } from '@prisma/client';
import { BasePrismaController } from '../../interfaces/base-prisma-controller.interface';

/**
 * Interface for TaxBracket controller
 */
export interface ITaxBracketPrismaController {
  // Basic CRUD
  create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    baseTax: number;
    rate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<TaxBracket>;
  
  findById(id: string): Promise<TaxBracket | null>;
  findMany(organizationId: string, filter?: {
    effectiveDate?: Date;
    minSalary?: number;
    maxSalary?: number;
  }): Promise<TaxBracket[]>;
  
  update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    baseTax?: number;
    rate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<TaxBracket>;
  
  delete(id: string): Promise<TaxBracket>;
  
  // Query methods
  findApplicableBracket(
    organizationId: string,
    salary: number,
    date?: Date
  ): Promise<TaxBracket | null>;
  
  findBracketsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TaxBracket[]>;
  
  // Bulk operations
  bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      baseTax: number;
      rate: number;
    }>
  ): Promise<{ count: number }>;
  
  createBulkBrackets(
    organizationId: string,
    brackets: Array<{
      minSalary: number;
      maxSalary?: number;
      baseTax: number;
      rate: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
    }>
  ): Promise<{ count: number }>;
}

/**
 * TaxBracket Prisma Controller Implementation
 * Handles all database operations for tax brackets
 */
export class TaxBracketPrismaController 
  extends BasePrismaController<TaxBracket, any, any>
  implements ITaxBracketPrismaController {
  
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: {
    organizationId: string;
    minSalary: number;
    maxSalary?: number;
    baseTax: number;
    rate: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<TaxBracket> {
    return await this.prisma.taxBracket.create({
      data: data as any, // Type assertion to bypass Prisma type generation issue
    });
  }

  async findById(id: string): Promise<TaxBracket | null> {
    return await this.prisma.taxBracket.findUnique({
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
  ): Promise<TaxBracket[]> {
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

    return await this.prisma.taxBracket.findMany({
      where,
      orderBy: { minSalary: 'asc' },
    });
  }

  async update(id: string, data: {
    minSalary?: number;
    maxSalary?: number;
    baseTax?: number;
    rate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<TaxBracket> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'TaxBracket');
    }

    return await this.prisma.taxBracket.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<TaxBracket> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'TaxBracket');
    }

    return await this.prisma.taxBracket.delete({
      where: { id },
    });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return await this.prisma.taxBracket.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateMany(filter: any, data: any): Promise<{ count: number }> {
    return await this.prisma.taxBracket.updateMany({
      where: filter,
      data,
    });
  }

  async deleteMany(filter: any): Promise<{ count: number }> {
    return await this.prisma.taxBracket.deleteMany({
      where: filter,
    });
  }

  /**
   * Find the applicable tax bracket for a given salary and date
   */
  async findApplicableBracket(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<TaxBracket | null> {
    return await this.prisma.taxBracket.findFirst({
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
   * Find all brackets effective within a date range
   */
  async findBracketsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TaxBracket[]> {
    return await this.prisma.taxBracket.findMany({
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
   * Bulk update tax rates for multiple brackets
   */
  async bulkUpdateRates(
    organizationId: string,
    updates: Array<{
      id: string;
      baseTax: number;
      rate: number;
    }>
  ): Promise<{ count: number }> {
    return await this.transaction(async (tx) => {
      let count = 0;
      
      for (const update of updates) {
        // Verify bracket belongs to organization
        const bracket = await tx.taxBracket.findFirst({
          where: { id: update.id, organizationId },
        });
        
        if (bracket) {
          await tx.taxBracket.update({
            where: { id: update.id },
            data: {
              baseTax: update.baseTax,
              rate: update.rate,
            },
          });
          count++;
        }
      }
      
      return { count };
    });
  }

  /**
   * Create multiple tax brackets in bulk
   */
  async createBulkBrackets(
    organizationId: string,
    brackets: Array<{
      minSalary: number;
      maxSalary?: number;
      baseTax: number;
      rate: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
    }>
  ): Promise<{ count: number }> {
    const data = brackets.map(bracket => ({
      ...bracket,
      organizationId,
    }));

    return await this.createMany(data);
  }
}
