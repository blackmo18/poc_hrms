import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedCompensation(prisma: PrismaClient, generateULID: () => string, employees: any[], organization: any, seniorEngineer: any) {
  // === Compensation ===
  // Create sample compensation records
  await Promise.all(
    employees.map(employee =>
      prisma.compensation.create({
        data: {
          id: generateULID(),
          employeeId: employee.id,
          organizationId: organization.id,
          baseSalary: employee.jobTitleId === seniorEngineer.id ? 120000 : 75000,
          payFrequency: 'MONTHLY',
          effectiveDate: new Date('2023-01-01'),
        } as any,
      })
    )
  );

  console.log('✅ Created compensation records');
}
