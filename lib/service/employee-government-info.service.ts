import { EmployeeGovernmentInfoController } from '@/lib/controllers';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEmployeeGovernmentInfo {
  employeeId: string;
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
}

export interface UpdateEmployeeGovernmentInfo {
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
}

export interface BulkUpdateData {
  employeeId: string;
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
}

export class EmployeeGovernmentInfoService {
  constructor(private controller: EmployeeGovernmentInfoController) {}

  async getEmployeeGovernmentInfo(employeeId: string, organizationId: string) {
    return await this.controller.getEmployeeGovernmentInfo(employeeId, organizationId);
  }

  async getAll(organizationId: string, options?: PaginationOptions): Promise<PaginatedResponse<any>> {
    const result = await this.controller.getAllEmployeesGovernmentInfo(organizationId);
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

  async create(organizationId: string, data: CreateEmployeeGovernmentInfo) {
    // Validation
    this.validateGovernmentNumbers(data);

    return await this.controller.createEmployeeGovernmentInfo(organizationId, data);
  }

  async update(id: string, organizationId: string, data: UpdateEmployeeGovernmentInfo) {
    // Validation
    this.validateGovernmentNumbers(data);

    return await this.controller.updateEmployeeGovernmentInfo(id, organizationId, data);
  }

  async delete(id: string, organizationId: string) {
    return await this.controller.deleteEmployeeGovernmentInfo(id, organizationId);
  }

  async searchEmployeesByGovernmentNumber(
    organizationId: string,
    searchType: 'sss' | 'philhealth' | 'pagibig' | 'tin',
    number: string
  ) {
    return await this.controller.searchEmployeesByGovernmentNumber(
      organizationId,
      searchType,
      number
    );
  }

  async validateGovernmentNumbers(data: {
    sssNumber?: string;
    philhealthNumber?: string;
    pagibigNumber?: string;
    tinNumber?: string;
  }) {
    return await this.controller.validateGovernmentNumbers(data);
  }

  async bulkUpdateGovernmentInfo(
    organizationId: string,
    updates: BulkUpdateData[]
  ) {
    // Validate all updates
    for (const update of updates) {
      const validation = await this.validateGovernmentNumbers(update);
      if (!validation.isValid) {
        throw new Error(`Invalid government numbers for employee ${update.employeeId}: ${validation.errors.join(', ')}`);
      }
    }

    return await this.controller.bulkUpdateGovernmentInfo(organizationId, updates);
  }

  async exportGovernmentInfo(
    organizationId: string,
    format: 'csv' | 'excel' = 'csv'
  ) {
    return await this.controller.exportGovernmentInfo(organizationId, format);
  }

  async getEmployeesWithoutGovernmentInfo(organizationId: string) {
    const allEmployees = await this.getAll(organizationId, { limit: 1000 });
    const employeesWithInfo = await this.getAll(organizationId, { limit: 1000 });
    
    // Get employee IDs that have government info
    const employeeIdsWithInfo = new Set(
      employeesWithInfo.data.map((info: any) => info.employeeId)
    );

    // Filter employees without government info
    const employeesWithoutInfo = allEmployees.data.filter((emp: any) => 
      !employeeIdsWithInfo.has(emp.id)
    );

    return employeesWithoutInfo;
  }

  async getGovernmentInfoCompliance(organizationId: string) {
    const allEmployees = await this.getAll(organizationId, { limit: 1000 });
    const governmentInfo = await this.getAll(organizationId, { limit: 1000 });

    const totalEmployees = allEmployees.data.length;
    const employeesWithInfo = governmentInfo.data.length;
    const complianceRate = totalEmployees > 0 ? (employeesWithInfo / totalEmployees) * 100 : 0;

    // Check completeness of information
    let completeInfo = 0;
    let partialInfo = 0;

    governmentInfo.data.forEach((info: any) => {
      const fields = [
        info.sssNumber,
        info.philhealthNumber,
        info.pagibigNumber,
        info.tinNumber
      ].filter(Boolean);

      if (fields.length === 4) {
        completeInfo++;
      } else if (fields.length > 0) {
        partialInfo++;
      }
    });

    return {
      totalEmployees,
      employeesWithInfo,
      employeesWithoutInfo: totalEmployees - employeesWithInfo,
      complianceRate: Math.round(complianceRate * 100) / 100,
      completeInfo,
      partialInfo,
      missingInfo: totalEmployees - completeInfo - partialInfo,
    };
  }

  async getGovernmentInfoByDepartment(organizationId: string) {
    const governmentInfo = await this.getAll(organizationId, { limit: 1000 });

    const departmentStats: { [key: string]: { total: number; withInfo: number; complete: number } } = {};

    governmentInfo.data.forEach((info: any) => {
      const deptName = info.employee?.department?.name || 'Unassigned';
      
      if (!departmentStats[deptName]) {
        departmentStats[deptName] = { total: 0, withInfo: 0, complete: 0 };
      }

      departmentStats[deptName].total++;
      departmentStats[deptName].withInfo++;

      const fields = [
        info.sssNumber,
        info.philhealthNumber,
        info.pagibigNumber,
        info.tinNumber
      ].filter(Boolean);

      if (fields.length === 4) {
        departmentStats[deptName].complete++;
      }
    });

    return departmentStats;
  }

  async syncWithEmployeeUpdates(employeeId: string, organizationId: string) {
    // This method can be called when an employee is updated
    // to ensure government info remains valid
    try {
      const info = await this.getEmployeeGovernmentInfo(employeeId, organizationId);
      
      // Re-validate the government numbers
      const validation = await this.validateGovernmentNumbers({
        sssNumber: info.sssNumber || undefined,
        philhealthNumber: info.philhealthNumber || undefined,
        pagibigNumber: info.pagibigNumber || undefined,
        tinNumber: info.tinNumber || undefined,
      });

      if (!validation.isValid) {
        // Log validation errors or notify admin
        console.warn(`Government info validation failed for employee ${employeeId}:`, validation.errors);
        return {
          valid: false,
          errors: validation.errors,
        };
      }

      return { valid: true };
    } catch (error: any) {
      if (error.message.includes('not found')) {
        // Employee doesn't have government info yet
        return { valid: true, hasInfo: false };
      }
      throw error;
    }
  }
}

let employeeGovernmentInfoService: EmployeeGovernmentInfoService;

export function getEmployeeGovernmentInfoService(): EmployeeGovernmentInfoService {
  if (!employeeGovernmentInfoService) {
    const { prisma } = require('@/lib/db');
    const controller = new EmployeeGovernmentInfoController(prisma);
    employeeGovernmentInfoService = new EmployeeGovernmentInfoService(controller);
  }
  return employeeGovernmentInfoService;
}
