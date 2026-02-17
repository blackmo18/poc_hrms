import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGovernmentContributions() {
  const organizationId = '01KHN7P1NR9CX7F8FDBB406QQS'; // Replace with your organization ID

  try {
    // Delete existing rates for this organization
    await prisma.philhealthContribution.deleteMany({ where: { organizationId } });
    await prisma.sSSContribution.deleteMany({ where: { organizationId } });
    await prisma.pagibigContribution.deleteMany({ where: { organizationId } });
    await prisma.taxBracket.deleteMany({ where: { organizationId } });

    // Philhealth Rates 2024
    await prisma.philhealthContribution.createMany({
      data: [
        {
          id: 'ph1',
          organizationId,
          minSalary: 0,
          maxSalary: 10000,
          employeeRate: 0.045,
          employerRate: 0.055,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'ph2',
          organizationId,
          minSalary: 10000.01,
          maxSalary: 60000,
          employeeRate: 0.045,
          employerRate: 0.055,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'ph3',
          organizationId,
          minSalary: 60000.01,
          maxSalary: null,
          employeeRate: 0.045,
          employerRate: 0.055,
          effectiveFrom: new Date('2024-01-01'),
        },
      ],
    });

    // SSS Rates 2024 (simplified)
    await prisma.sSSContribution.createMany({
      data: [
        {
          id: 'sss1',
          organizationId,
          minSalary: 0,
          maxSalary: 4250,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss2',
          organizationId,
          minSalary: 4250.01,
          maxSalary: 8500,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss3',
          organizationId,
          minSalary: 8500.01,
          maxSalary: 12750,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss4',
          organizationId,
          minSalary: 12750.01,
          maxSalary: 17000,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss5',
          organizationId,
          minSalary: 17000.01,
          maxSalary: 21250,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss6',
          organizationId,
          minSalary: 21250.01,
          maxSalary: 25500,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss7',
          organizationId,
          minSalary: 25500.01,
          maxSalary: 29750,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'sss8',
          organizationId,
          minSalary: 29750.01,
          maxSalary: null,
          employeeRate: 0.045,
          employerRate: 0.135,
          ecRate: 0.01,
          effectiveFrom: new Date('2024-01-01'),
        },
      ],
    });

    // Pagibig Rates 2024
    await prisma.pagibigContribution.createMany({
      data: [
        {
          id: 'pagibig1',
          organizationId,
          minSalary: 0,
          maxSalary: 1500,
          employeeRate: 0.01,
          employerRate: 0.02,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'pagibig2',
          organizationId,
          minSalary: 1500.01,
          maxSalary: 5000,
          employeeRate: 0.02,
          employerRate: 0.02,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'pagibig3',
          organizationId,
          minSalary: 5000.01,
          maxSalary: null,
          employeeRate: 0.02,
          employerRate: 0.02,
          effectiveFrom: new Date('2024-01-01'),
        },
      ],
    });

    // Tax Brackets 2024 (Annual)
    await prisma.taxBracket.createMany({
      data: [
        {
          id: 'tax1',
          organizationId,
          minSalary: 0,
          maxSalary: 250000,
          baseTax: 0,
          rate: 0,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'tax2',
          organizationId,
          minSalary: 250001,
          maxSalary: 400000,
          baseTax: 0,
          rate: 0.20,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'tax3',
          organizationId,
          minSalary: 400001,
          maxSalary: 800000,
          baseTax: 30000,
          rate: 0.25,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'tax4',
          organizationId,
          minSalary: 800001,
          maxSalary: 2000000,
          baseTax: 130000,
          rate: 0.30,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'tax5',
          organizationId,
          minSalary: 2000001,
          maxSalary: 8000000,
          baseTax: 490000,
          rate: 0.32,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: 'tax6',
          organizationId,
          minSalary: 8000001,
          maxSalary: null,
          baseTax: 2410000,
          rate: 0.35,
          effectiveFrom: new Date('2024-01-01'),
        },
      ],
    });

    console.log('Government contribution rates seeded successfully!');
  } catch (error) {
    console.error('Error seeding government contributions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedGovernmentContributions();
