import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedSSSContributions(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any
) {
  console.log('🛡️ Seeding SSS contributions...');

  // SSS Contribution Table 2024 (Monthly)
  const sssRates = [
    {
      minSalary: 2000,
      maxSalary: 2249.99,
      employeeRate: 0.045, // 4.5%
      employerRate: 0.135, // 13.5%
      ecRate: 0.01, // 1%
    },
    {
      minSalary: 2250,
      maxSalary: 2749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 2750,
      maxSalary: 3249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 3250,
      maxSalary: 3749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 3750,
      maxSalary: 4249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 4250,
      maxSalary: 4749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 4750,
      maxSalary: 5249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 5250,
      maxSalary: 5749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 5750,
      maxSalary: 6249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 6250,
      maxSalary: 6749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 6750,
      maxSalary: 7249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 7250,
      maxSalary: 7749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 7750,
      maxSalary: 8249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 8250,
      maxSalary: 8749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 8750,
      maxSalary: 9249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 9250,
      maxSalary: 9749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 9750,
      maxSalary: 10249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 10250,
      maxSalary: 10749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 10750,
      maxSalary: 11249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 11250,
      maxSalary: 11749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 11750,
      maxSalary: 12249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 12250,
      maxSalary: 12749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 12750,
      maxSalary: 13249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 13250,
      maxSalary: 13749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 13750,
      maxSalary: 14249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 14250,
      maxSalary: 14749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 14750,
      maxSalary: 15249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 15250,
      maxSalary: 15749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 15750,
      maxSalary: 16249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 16250,
      maxSalary: 16749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 16750,
      maxSalary: 17249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 17250,
      maxSalary: 17749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 17750,
      maxSalary: 18249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 18250,
      maxSalary: 18749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 18750,
      maxSalary: 19249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 19250,
      maxSalary: 19749.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 19750,
      maxSalary: 20249.99,
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
    {
      minSalary: 20250,
      maxSalary: null, // No maximum
      employeeRate: 0.045,
      employerRate: 0.135,
      ecRate: 0.01,
    },
  ];

  for (const rate of sssRates) {
    await prisma.sSSContribution.create({
      data: {
        id: generateULID(),
        organizationId: organization.id,
        minSalary: rate.minSalary,
        maxSalary: rate.maxSalary,
        employeeRate: rate.employeeRate,
        employerRate: rate.employerRate,
        ecRate: rate.ecRate,
        effectiveFrom: new Date('2024-01-01'),
      },
    });
  }

  console.log('✅ SSS contributions seeded successfully');
}
