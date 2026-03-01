import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedPhilhealthContributions(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any
) {
  console.log('🏥 Seeding Philhealth contributions...');

  // Philhealth Contribution Rates 2024
  // Updated to 5% premium sharing (2.5% employee, 2.5% employer)
  // With salary floor of ₱10,000 and ceiling of ₱100,000
  const philhealthRates = [
    {
      minSalary: 0,
      maxSalary: 9999.99,
      employeeRate: 0.025, // 2.5%
      employerRate: 0.025, // 2.5%
      note: 'Below minimum - still charged minimum rate'
    },
    {
      minSalary: 10000,
      maxSalary: 59999.99,
      employeeRate: 0.025, // 2.5%
      employerRate: 0.025, // 2.5%
      note: 'Regular rate'
    },
    {
      minSalary: 60000,
      maxSalary: 99999.99,
      employeeRate: 0.025, // 2.5%
      employerRate: 0.025, // 2.5%
      note: 'Regular rate'
    },
    {
      minSalary: 100000,
      maxSalary: null, // No maximum - salary ceiling
      employeeRate: 0.025, // 2.5%
      employerRate: 0.025, // 2.5%
      note: 'Salary ceiling - maximum monthly premium of ₱5,000'
    },
  ];

  for (const rate of philhealthRates) {
    await prisma.philhealthContribution.create({
      data: {
        id: generateULID(),
        organizationId: organization.id,
        minSalary: rate.minSalary,
        maxSalary: rate.maxSalary,
        employeeRate: rate.employeeRate,
        employerRate: rate.employerRate,
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
      },
    });
  }

  console.log('✅ Philhealth contributions seeded successfully');
  console.log('📊 Rate: 5% total (2.5% employee, 2.5% employer)');
  console.log('📊 Salary range: ₱10,000 - ₱100,000');
  console.log('📊 Maximum monthly premium: ₱5,000');
}
