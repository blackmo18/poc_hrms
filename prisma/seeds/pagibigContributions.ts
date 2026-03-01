import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedPagibigContributions(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any
) {
  console.log('🏠 Seeding Pagibig contributions...');

  // Pagibig Contribution Rates 2024
  // Maximum monthly compensation: ₱5,000
  // Maximum monthly contribution: ₱100 for employee, ₱100 for employer
  const pagibigRates = [
    {
      minSalary: 0,
      maxSalary: 1500,
      employeeRate: 0.01, // 1%
      employerRate: 0.02, // 2%
      note: 'Minimum earners'
    },
    {
      minSalary: 1500.01,
      maxSalary: 5000,
      employeeRate: 0.02, // 2%
      employerRate: 0.02, // 2%
      note: 'Regular rate up to ₱5,000'
    },
    {
      minSalary: 5000.01,
      maxSalary: null, // No maximum - but compensation is capped at ₱5,000
      employeeRate: 0.02, // 2%
      employerRate: 0.02, // 2%
      note: 'Compensation capped at ₱5,000 for calculation'
    },
  ];

  for (const rate of pagibigRates) {
    await prisma.pagibigContribution.create({
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

  console.log('✅ Pagibig contributions seeded successfully');
  console.log('📊 Rate: 1-2% employee, 2% employer');
  console.log('📊 Maximum monthly compensation: ₱5,000');
  console.log('📊 Maximum monthly contribution: ₱100 employee, ₱100 employer');
}
