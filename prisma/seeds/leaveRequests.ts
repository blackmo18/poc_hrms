import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { ensureUTCForStorage } from '@/lib/utils/timezone-utils';

export async function seedLeaveRequests(prisma: PrismaClient, generateULID: () => string, employees: any[], organization: any) {
  // === Leave Requests ===
  // Create sample leave requests
  // Use local ISO dates (Manila timezone) and convert to UTC for storage
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[0].id,
      organizationId: organization.id,
      leaveType: 'VACATION',
      startDate: ensureUTCForStorage('2024-12-20T00:00:00+08:00'),
      endDate: ensureUTCForStorage('2024-12-25T23:59:59+08:00'),
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
      startDate: ensureUTCForStorage('2024-11-15T00:00:00+08:00'),
      endDate: ensureUTCForStorage('2024-11-16T23:59:59+08:00'),
      status: 'APPROVED',
      remarks: 'Flu symptoms',
    } as any,
  });

  console.log('✅ Created sample leave requests');

  console.log('✅ Created sample overtime requests');
}
