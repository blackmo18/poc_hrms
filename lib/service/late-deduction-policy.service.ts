import { LateDeductionPolicyController } from '@/lib/controllers';
import { LatePolicyType, DeductionMethod } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { prisma } from '@/lib/db';
import { logInfo, logWarn } from '@/lib/utils/logger';

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

export interface CreateLateDeductionPolicy {
  name: string;
  policyType: LatePolicyType;
  deductionMethod: DeductionMethod;
  fixedAmount?: number;
  percentageRate?: number;
  hourlyRateMultiplier?: number;
  gracePeriodMinutes?: number;
  minimumLateMinutes?: number;
  maxDeductionPerDay?: number;
  maxDeductionPerCutoff?: number;
  effectiveDate: Date;
  endDate?: Date;
}

export interface UpdateLateDeductionPolicy {
  name?: string;
  policyType?: LatePolicyType;
  deductionMethod?: DeductionMethod;
  fixedAmount?: number;
  percentageRate?: number;
  hourlyRateMultiplier?: number;
  gracePeriodMinutes?: number;
  minimumLateMinutes?: number;
  maxDeductionPerDay?: number;
  maxDeductionPerCutoff?: number;
  effectiveDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export class LateDeductionPolicyService {
  constructor(private controller: LateDeductionPolicyController) {}

  async getById(id: string, organizationId: string) {
    return await this.controller.getById(id, organizationId);
  }

  async getAll(organizationId: string, options?: PaginationOptions): Promise<PaginatedResponse<any>> {
    const result = await this.controller.getAll(organizationId);
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

  async create(organizationId: string, data: CreateLateDeductionPolicy) {
    // Validation
    this.validatePolicyData(data);

    // Check if policy with same name already exists
    const existing = await this.controller.getAll(organizationId);
    const duplicate = existing.find(p => 
      p.name.toLowerCase() === data.name.toLowerCase() &&
      p.isActive
    );

    if (duplicate) {
      throw new Error('A policy with this name already exists');
    }

    return await this.controller.create(organizationId, data);
  }

  async update(id: string, organizationId: string, data: UpdateLateDeductionPolicy) {
    // Validation
    if (data.deductionMethod) {
      this.validateDeductionMethod(data.deductionMethod, data);
    }

    return await this.controller.update(id, organizationId, data);
  }

  async delete(id: string, organizationId: string) {
    // Check if policy is being used in any payroll calculations
    // This would require additional logic to check for active usage
    
    return await this.controller.delete(id, organizationId);
  }

  async getActivePolicies(organizationId: string, date: Date = new Date()) {
    return await this.controller.getActivePolicies(organizationId, date);
  }

  async getPolicyByType(organizationId: string, policyType: LatePolicyType, date: Date = new Date()) {
    return await this.controller.getPolicyByType(organizationId, policyType, date);
  }

  async calculateDeduction(
    organizationId: string,
    policyType: LatePolicyType,
    lateMinutes: number,
    dailyRate: number,
    hourlyRate: number,
    date: Date = new Date()
  ): Promise<number> {
    // Get applicable policy
    const policy = await this.getPolicyByType(organizationId, policyType, date);
    
    if (!policy) {
      logWarn(`No ${policyType} policy found for organization ${organizationId}`);
      return 0;
    }

    // Check if late minutes meet minimum threshold
    if (lateMinutes < policy.minimumLateMinutes) {
      return 0;
    }

    let deduction = 0;

    switch (policy.deductionMethod) {
      case 'FIXED_AMOUNT':
        deduction = policy.fixedAmount || 0;
        break;

      case 'PERCENTAGE':
        deduction = (dailyRate * (policy.percentageRate || 0)) / 100;
        break;

      case 'HOURLY_RATE':
        // Calculate late hours (rounded up to nearest hour or partial hour based on policy)
        const lateHours = lateMinutes / 60;
        deduction = hourlyRate * lateHours * (policy.hourlyRateMultiplier || 1);
        break;

      default:
        throw new Error(`Unsupported deduction method: ${policy.deductionMethod}`);
    }

    // Apply maximum limits
    if (policy.maxDeductionPerDay && deduction > policy.maxDeductionPerDay) {
      deduction = policy.maxDeductionPerDay;
    }

    if (deduction > 0) {
      const policyLog = {
        type: 'POLICY_APPLICATION',
        timestamp: new Date().toISOString(),
        references: {
          organizationId,
          policyId: policy.id,
          employeeId: null, // Will be populated by caller
          date: date.toISOString().split('T')[0]
        },
        policy: {
          type: policyType,
          method: policy.deductionMethod,
          minimumMinutes: policy.minimumLateMinutes,
          gracePeriod: policy.gracePeriodMinutes
        },
        calculation: {
          minutes: lateMinutes,
          deduction
        }
      };
      logInfo('POLICY_APPLICATION', policyLog);
    }
    
    return Math.round(deduction * 100) / 100; // Round to 2 decimal places
  }

  async duplicatePolicy(id: string, organizationId: string, newName: string) {
    const original = await this.getById(id, organizationId);
    
    const duplicateData: CreateLateDeductionPolicy = {
      name: newName,
      policyType: original.policyType,
      deductionMethod: original.deductionMethod,
      fixedAmount: original.fixedAmount || undefined,
      percentageRate: original.percentageRate || undefined,
      hourlyRateMultiplier: original.hourlyRateMultiplier || undefined,
      gracePeriodMinutes: original.gracePeriodMinutes,
      minimumLateMinutes: original.minimumLateMinutes,
      maxDeductionPerDay: original.maxDeductionPerDay || undefined,
      maxDeductionPerCutoff: original.maxDeductionPerCutoff || undefined,
      effectiveDate: new Date(),
      endDate: original.endDate,
    };

    return await this.create(organizationId, duplicateData);
  }

  private validatePolicyData(data: CreateLateDeductionPolicy) {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Policy name is required');
    }

    // Validate deduction method and required fields
    this.validateDeductionMethod(data.deductionMethod, data);

    // Validate dates
    if (data.effectiveDate >= (data.endDate || new Date('9999-12-31'))) {
      throw new Error('Effective date must be before end date');
    }

    // Validate numeric values
    if (data.fixedAmount !== undefined && data.fixedAmount < 0) {
      throw new Error('Fixed amount cannot be negative');
    }

    if (data.percentageRate !== undefined && (data.percentageRate < 0 || data.percentageRate > 100)) {
      throw new Error('Percentage rate must be between 0 and 100');
    }

    if (data.hourlyRateMultiplier !== undefined && data.hourlyRateMultiplier < 0) {
      throw new Error('Hourly rate multiplier cannot be negative');
    }

    if (data.gracePeriodMinutes !== undefined && data.gracePeriodMinutes < 0) {
      throw new Error('Grace period cannot be negative');
    }

    if (data.minimumLateMinutes !== undefined && data.minimumLateMinutes < 0) {
      throw new Error('Minimum late minutes cannot be negative');
    }
  }

  private validateDeductionMethod(method: DeductionMethod, data: any) {
    switch (method) {
      case 'FIXED_AMOUNT':
        if (!data.fixedAmount || data.fixedAmount <= 0) {
          throw new Error('Fixed amount is required and must be greater than 0 for FIXED_AMOUNT method');
        }
        break;

      case 'PERCENTAGE':
        if (!data.percentageRate || data.percentageRate <= 0 || data.percentageRate > 100) {
          throw new Error('Percentage rate is required and must be between 0 and 100 for PERCENTAGE method');
        }
        break;

      case 'HOURLY_RATE':
        if (!data.hourlyRateMultiplier || data.hourlyRateMultiplier <= 0) {
          throw new Error('Hourly rate multiplier is required and must be greater than 0 for HOURLY_RATE method');
        }
        break;

      default:
        throw new Error(`Invalid deduction method: ${method}`);
    }
  }
}

let lateDeductionPolicyService: LateDeductionPolicyService;

export function getLateDeductionPolicyService(): LateDeductionPolicyService {
  if (!lateDeductionPolicyService) {
    const controller = new LateDeductionPolicyController(prisma);
    lateDeductionPolicyService = new LateDeductionPolicyService(controller);
  }
  return lateDeductionPolicyService;
}
