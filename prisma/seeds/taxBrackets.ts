import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedTaxBrackets(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any
) {
  console.log('📊 Seeding tax brackets...');

  // BIR Tax Table for 2024 (Monthly)
  const taxBrackets = [
    {
      minSalary: 0,
      maxSalary: 20833,
      baseTax: 0,
      rate: 0,
    },
    {
      minSalary: 20833,
      maxSalary: 33333,
      baseTax: 0,
      rate: 0.20,
    },
    {
      minSalary: 33333,
      maxSalary: 66667,
      baseTax: 2500,
      rate: 0.25,
    },
    {
      minSalary: 66667,
      maxSalary: 166667,
      baseTax: 10833,
      rate: 0.30,
    },
    {
      minSalary: 166667,
      maxSalary: 666667,
      baseTax: 40833,
      rate: 0.32,
    },
    {
      minSalary: 666667,
      maxSalary: null,
      baseTax: 200833,
      rate: 0.35,
    },
  ];

  for (const bracket of taxBrackets) {
    await prisma.taxBracket.create({
      data: {
        id: generateULID(),
        organizationId: organization.id,
        minSalary: bracket.minSalary,
        maxSalary: bracket.maxSalary,
        baseTax: bracket.baseTax,
        rate: bracket.rate,
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
      },
    });
  }

  console.log('✅ Tax brackets seeded successfully');
}
