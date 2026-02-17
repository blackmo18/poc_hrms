import { PrismaClient, EmployeeGovernmentInfo } from '@prisma/client';
import { BasePrismaController } from '../../interfaces/base-prisma-controller.interface';

/**
 * Interface for EmployeeGovernmentInfo controller
 */
export interface IEmployeeGovernmentInfoPrismaController {
  // Basic CRUD
  create(data: {
    employeeId: string;
    organizationId: string;
    tin?: string;
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    taxStatus?: string;
    dependents?: number;
  }): Promise<EmployeeGovernmentInfo>;
  
  findById(id: string): Promise<EmployeeGovernmentInfo | null>;
  findByEmployeeId(employeeId: string): Promise<EmployeeGovernmentInfo | null>;
  findMany(organizationId: string, filter?: {
    employeeId?: string;
    taxStatus?: string;
  }): Promise<EmployeeGovernmentInfo[]>;
  
  update(id: string, data: {
    tin?: string;
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    taxStatus?: string;
    dependents?: number;
  }): Promise<EmployeeGovernmentInfo>;
  
  delete(id: string): Promise<EmployeeGovernmentInfo>;
  
  // Query methods
  findByGovernmentId(
    organizationId: string,
    type: 'tin' | 'sssNumber' | 'philhealthNumber' | 'pagibigNumber',
    value: string
  ): Promise<EmployeeGovernmentInfo | null>;
  
  findEmployeesWithoutInfo(organizationId: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>>;
  
  // Bulk operations
  bulkUpdate(
    organizationId: string,
    updates: Array<{
      employeeId: string;
      data: Partial<EmployeeGovernmentInfo>;
    }>
  ): Promise<{ count: number }>;
  
  validateGovernmentIds(data: {
    tin?: string;
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
  }): { isValid: boolean; errors: string[] };
}

/**
 * EmployeeGovernmentInfo Prisma Controller Implementation
 * Handles all database operations for employee government information
 */
export class EmployeeGovernmentInfoPrismaController 
  extends BasePrismaController<EmployeeGovernmentInfo, any, any>
  implements IEmployeeGovernmentInfoPrismaController {
  
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: {
    employeeId: string;
    organizationId: string;
    tin?: string;
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    taxStatus?: string;
    dependents?: number;
  }): Promise<EmployeeGovernmentInfo> {
    // Check if government info already exists for employee
    const existing = await this.findByEmployeeId(data.employeeId);
    if (existing) {
      throw new Error(`Government info already exists for employee ${data.employeeId}`);
    }

    // Validate government IDs
    const validation = this.validateGovernmentIds({
      tin: data.tin,
      sssNumber: data.sssNumber,
      philhealthNumber: data.philhealthNumber,
      pagibigNumber: data.pagibigNumber,
    });

    if (!validation.isValid) {
      throw new Error(`Invalid government IDs: ${validation.errors.join(', ')}`);
    }

    return await this.prisma.employeeGovernmentInfo.create({
      data: data as any, // Type assertion to bypass Prisma type generation issue
    });
  }

  async findById(id: string): Promise<EmployeeGovernmentInfo | null> {
    return await this.prisma.employeeGovernmentInfo.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<EmployeeGovernmentInfo | null> {
    return await this.prisma.employeeGovernmentInfo.findUnique({
      where: { employeeId },
    });
  }

  async findMany(
    organizationId: string,
    filter?: {
      employeeId?: string;
      taxStatus?: string;
    }
  ): Promise<EmployeeGovernmentInfo[]> {
    const where: any = { organizationId };

    if (filter?.employeeId) {
      where.employeeId = filter.employeeId;
    }

    if (filter?.taxStatus) {
      where.taxStatus = filter.taxStatus;
    }

    return await this.prisma.employeeGovernmentInfo.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: {
    tin?: string;
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    taxStatus?: string;
    dependents?: number;
  }): Promise<EmployeeGovernmentInfo> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'EmployeeGovernmentInfo');
    }

    // Validate government IDs if provided
    if (data.tin || data.sssNumber || data.philhealthNumber || data.pagibigNumber) {
      const validation = this.validateGovernmentIds({
        tin: data.tin,
        sssNumber: data.sssNumber,
        philhealthNumber: data.philhealthNumber,
        pagibigNumber: data.pagibigNumber,
      });

      if (!validation.isValid) {
        throw new Error(`Invalid government IDs: ${validation.errors.join(', ')}`);
      }
    }

    return await this.prisma.employeeGovernmentInfo.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<EmployeeGovernmentInfo> {
    const existing = await this.findById(id);
    if (!existing) {
      this.handleNotFound(id, 'EmployeeGovernmentInfo');
    }

    return await this.prisma.employeeGovernmentInfo.delete({
      where: { id },
    });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return await this.prisma.employeeGovernmentInfo.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateMany(filter: any, data: any): Promise<{ count: number }> {
    return await this.prisma.employeeGovernmentInfo.updateMany({
      where: filter,
      data,
    });
  }

  async deleteMany(filter: any): Promise<{ count: number }> {
    return await this.prisma.employeeGovernmentInfo.deleteMany({
      where: filter,
    });
  }

  /**
   * Find employee by government ID number
   */
  async findByGovernmentId(
    organizationId: string,
    type: 'tin' | 'sssNumber' | 'philhealthNumber' | 'pagibigNumber',
    value: string
  ): Promise<EmployeeGovernmentInfo | null> {
    const where: any = { organizationId, [type]: value };
    
    return await this.prisma.employeeGovernmentInfo.findFirst({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find all employees without government information
   */
  async findEmployeesWithoutInfo(organizationId: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>> {
    // Find all employees in the organization
    const employees = await this.prisma.employee.findMany({
      where: { organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Find employees with government info
    const employeesWithInfo = await this.prisma.employeeGovernmentInfo.findMany({
      where: { organizationId },
      select: { employeeId: true },
    });

    const employeeIdsWithInfo = new Set(employeesWithInfo.map(e => e.employeeId));

    // Return employees without government info
    return employees.filter(emp => !employeeIdsWithInfo.has(emp.id));
  }

  /**
   * Bulk update government information for multiple employees
   */
  async bulkUpdate(
    organizationId: string,
    updates: Array<{
      employeeId: string;
      data: Partial<EmployeeGovernmentInfo>;
    }>
  ): Promise<{ count: number }> {
    return await this.transaction(async (tx) => {
      let count = 0;
      
      for (const update of updates) {
        // Find existing record
        const existing = await tx.employeeGovernmentInfo.findUnique({
          where: { employeeId: update.employeeId },
        });
        
        if (existing) {
          // Update existing
          await tx.employeeGovernmentInfo.update({
            where: { employeeId: update.employeeId },
            data: update.data,
          });
          count++;
        } else {
          // Create new
          await tx.employeeGovernmentInfo.create({
            data: {
              ...update.data,
              employeeId: update.employeeId,
              organizationId,
            } as any,
          });
          count++;
        }
      }
      
      return { count };
    });
  }

  /**
   * Validate Philippine government ID formats
   */
  validateGovernmentIds(data: {
    tin?: string;
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // TIN validation (XXX-XXX-XXX-XXX)
    if (data.tin && !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(data.tin)) {
      errors.push('TIN must be in format XXX-XXX-XXX-XXX');
    }

    // SSS validation (XX-XXXXXXXX-X)
    if (data.sssNumber && !/^\d{2}-\d{8}-\d$/.test(data.sssNumber)) {
      errors.push('SSS number must be in format XX-XXXXXXXX-X');
    }

    // Philhealth validation (XX-XXXXXXXXXXX-X)
    if (data.philhealthNumber && !/^\d{2}-\d{11}-\d$/.test(data.philhealthNumber)) {
      errors.push('Philhealth number must be in format XX-XXXXXXXXXXX-X');
    }

    // Pagibig validation (XXXX-XXXX-XXXX)
    if (data.pagibigNumber && !/^\d{4}-\d{4}-\d{4}$/.test(data.pagibigNumber)) {
      errors.push('Pagibig number must be in format XXXX-XXXX-XXXX');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
