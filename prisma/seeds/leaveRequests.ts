import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedLeaveRequests(prisma: PrismaClient, generateULID: () => string, employees: any[], organization: any) {
  // === Leave Requests ===
  // Create sample leave requests
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[0].id,
      organizationId: organization.id,
      leaveType: 'VACATION',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-25'),
      status: 'PENDING',
      remarks: 'Christmas vacation',
    } as any,
  });

  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[1].id,
      organizationId: organization.id,
      leaveType: 'SICK',
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-16'),
      status: 'APPROVED',
      remarks: 'Flu symptoms',
    } as any,
  });

  console.log('✅ Created sample leave requests');

  console.log('✅ Created sample overtime requests');
}
