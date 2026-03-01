import { PrismaClient, LatePolicyType, DeductionMethod } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class LateDeductionPolicyController {
  constructor(private prisma: PrismaClient) {}

  async getAll(organizationId: string) {
    return await this.prisma.lateDeductionPolicy.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getById(id: string, organizationId: string) {
    const policy = await this.prisma.lateDeductionPolicy.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!policy) {
      throw new Error('Late deduction policy not found');
    }

    return policy;
  }

  async create(organizationId: string, data: {
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
  }) {
    return await this.prisma.lateDeductionPolicy.create({
      data: {
        id: generateULID(),
        organizationId,
        name: data.name,
        policyType: data.policyType,
        deductionMethod: data.deductionMethod,
        fixedAmount: data.fixedAmount,
        percentageRate: data.percentageRate,
        hourlyRateMultiplier: data.hourlyRateMultiplier,
        gracePeriodMinutes: data.gracePeriodMinutes || 0,
        minimumLateMinutes: data.minimumLateMinutes || 1,
        maxDeductionPerDay: data.maxDeductionPerDay,
        maxDeductionPerCutoff: data.maxDeductionPerCutoff,
        effectiveDate: data.effectiveDate,
        endDate: data.endDate,
        isActive: true,
      },
    });
  }

  async update(id: string, organizationId: string, data: Partial<{
    name: string;
    policyType: LatePolicyType;
    deductionMethod: DeductionMethod;
    fixedAmount: number;
    percentageRate: number;
    hourlyRateMultiplier: number;
    gracePeriodMinutes: number;
    minimumLateMinutes: number;
    maxDeductionPerDay: number;
    maxDeductionPerCutoff: number;
    effectiveDate: Date;
    endDate: Date;
    isActive: boolean;
  }>) {
    const existing = await this.getById(id, organizationId);

    return await this.prisma.lateDeductionPolicy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await this.getById(id, organizationId);

    return await this.prisma.lateDeductionPolicy.delete({
      where: { id },
    });
  }

  async getActivePolicies(organizationId: string, date: Date = new Date()) {
    return await this.prisma.lateDeductionPolicy.findMany({
      where: {
        organizationId,
        isActive: true,
        effectiveDate: {
          lte: date,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: date,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPolicyByType(organizationId: string, policyType: LatePolicyType, date: Date = new Date()) {
    return await this.prisma.lateDeductionPolicy.findFirst({
      where: {
        organizationId,
        policyType,
        isActive: true,
        effectiveDate: {
          lte: date,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: date,
            },
          },
        ],
      },
    });
  }
}
