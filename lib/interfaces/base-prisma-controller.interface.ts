import { PrismaClient } from '@prisma/client';

/**
 * Base interface for all Prisma controllers
 * Provides common CRUD operations and transaction support
 */
export interface IBasePrismaController<T, CreateData, UpdateData> {
  // Basic CRUD
  create(data: CreateData): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filter?: any): Promise<T[]>;
  update(id: string, data: UpdateData): Promise<T>;
  delete(id: string): Promise<T>;
  
  // Bulk operations
  createMany(data: CreateData[]): Promise<{ count: number }>;
  updateMany(filter: any, data: UpdateData): Promise<{ count: number }>;
  deleteMany(filter: any): Promise<{ count: number }>;
  
  // Transaction support
  transaction<R>(callback: (tx: PrismaClient) => Promise<R>): Promise<R>;
}

/**
 * Base Prisma controller implementation
 * Provides common functionality for all controllers
 */
export abstract class BasePrismaController<T, CreateData, UpdateData> implements IBasePrismaController<T, CreateData, UpdateData> {
  constructor(protected prisma: PrismaClient) {}

  abstract create(data: CreateData): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filter?: any): Promise<T[]>;
  abstract update(id: string, data: UpdateData): Promise<T>;
  abstract delete(id: string): Promise<T>;
  abstract createMany(data: CreateData[]): Promise<{ count: number }>;
  abstract updateMany(filter: any, data: UpdateData): Promise<{ count: number }>;
  abstract deleteMany(filter: any): Promise<{ count: number }>;

  async transaction<R>(callback: (tx: PrismaClient) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(callback);
  }

  /**
   * Helper method to handle common error scenarios
   */
  protected handleNotFound(id: string, entity: string): never {
    throw new Error(`${entity} with id ${id} not found`);
  }

  /**
   * Helper method to validate organization access
   */
  protected async validateOrganizationAccess(id: string, organizationId: string, model: any): Promise<T | null> {
    const entity = await model.findFirst({
      where: { id, organizationId },
    });

    if (!entity) {
      throw new Error(`${model.name} not found or access denied`);
    }

    return entity as T;
  }
}
