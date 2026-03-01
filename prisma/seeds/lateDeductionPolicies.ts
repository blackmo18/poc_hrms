import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

// Define the enum values locally to avoid import conflicts
const LatePolicyType = {
  LATE: 'LATE' as const,
  UNDERTIME: 'UNDERTIME' as const,
};

const DeductionMethod = {
  FIXED_AMOUNT: 'FIXED_AMOUNT' as const,
  PERCENTAGE: 'PERCENTAGE' as const,
  HOURLY_RATE: 'HOURLY_RATE' as const,
};

export async function seedLateDeductionPolicies(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any
) {
  console.log('🌱 Seeding late deduction policies...');

  const policies = [
    {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Standard Tardiness Policy',
      policyType: LatePolicyType.LATE,
      deductionMethod: DeductionMethod.FIXED_AMOUNT,
      fixedAmount: 100.00,
      gracePeriodMinutes: 5,
      minimumLateMinutes: 1,
      maxDeductionPerDay: 500.00,
      maxDeductionPerCutoff: 2000.00,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
    },
    {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Undertime Policy - Percentage',
      policyType: LatePolicyType.UNDERTIME,
      deductionMethod: DeductionMethod.PERCENTAGE,
      percentageRate: 50,
      gracePeriodMinutes: 0,
      minimumLateMinutes: 1,
      maxDeductionPerDay: 1000.00,
      maxDeductionPerCutoff: 5000.00,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
    },
    {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Absence Policy - Fixed Amount',
      policyType: LatePolicyType.UNDERTIME, // Using UNDERTIME for absences
      deductionMethod: DeductionMethod.FIXED_AMOUNT,
      fixedAmount: 1000.00,
      gracePeriodMinutes: 0,
      minimumLateMinutes: 1,
      maxDeductionPerDay: 1000.00,
      maxDeductionPerCutoff: 5000.00,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
    },
    {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Late Policy - Hourly Rate Multiplier',
      policyType: LatePolicyType.LATE,
      deductionMethod: DeductionMethod.HOURLY_RATE,
      hourlyRateMultiplier: 0.5,
      gracePeriodMinutes: 10,
      minimumLateMinutes: 15,
      maxDeductionPerDay: 800.00,
      maxDeductionPerCutoff: 3000.00,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
    },
    {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Strict Tardiness Policy',
      policyType: LatePolicyType.LATE,
      deductionMethod: DeductionMethod.FIXED_AMOUNT,
      fixedAmount: 200.00,
      gracePeriodMinutes: 0,
      minimumLateMinutes: 1,
      maxDeductionPerDay: 1000.00,
      maxDeductionPerCutoff: 4000.00,
      isActive: false, // Inactive policy
      effectiveDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
    },
  ];

  for (const policy of policies) {
    await prisma.lateDeductionPolicy.create({
      data: policy,
    });
  }

  console.log(`✅ Created ${policies.length} late deduction policies`);
  return policies;
}
