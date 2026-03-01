import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedEmployeeGovernmentInfo(
  prisma: PrismaClient,
  generateULID: () => string,
  employees: any[],
  organization: any
) {
  console.log('📋 Seeding employee government information...');

  // Sample government numbers for employees
  const governmentData = [
    {
      sssNumber: '01-2345678-9',
      philhealthNumber: '12-345678901-2',
      pagibigNumber: '1234-5678-9012',
      tinNumber: '123-456-789-000',
    },
    {
      sssNumber: '02-3456789-0',
      philhealthNumber: '23-456789012-3',
      pagibigNumber: '2345-6789-0123',
      tinNumber: '234-567-890-000',
    },
    {
      sssNumber: '03-4567890-1',
      philhealthNumber: '34-567890123-4',
      pagibigNumber: '3456-7890-1234',
      tinNumber: '345-678-901-000',
    },
    {
      sssNumber: '04-5678901-2',
      philhealthNumber: '45-678901234-5',
      pagibigNumber: '4567-8901-2345',
      tinNumber: '456-789-012-000',
    },
    {
      sssNumber: '05-6789012-3',
      philhealthNumber: '56-789012345-6',
      pagibigNumber: '5678-9012-3456',
      tinNumber: '567-890-123-000',
    },
  ];

  for (let i = 0; i < employees.length && i < governmentData.length; i++) {
    await prisma.employeeGovernmentInfo.create({
      data: {
        id: generateULID(),
        employeeId: employees[i].id,
        organizationId: organization.id,
        sssNumber: governmentData[i].sssNumber,
        philhealthNumber: governmentData[i].philhealthNumber,
        pagibigNumber: governmentData[i].pagibigNumber,
        tinNumber: governmentData[i].tinNumber,
      },
    });
  }

  console.log('✅ Employee government information seeded successfully');
}
