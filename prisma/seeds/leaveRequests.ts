import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { ensureUTCForStorage } from '@/lib/utils/timezone-utils';

export async function seedLeaveRequests(prisma: PrismaClient, generateULID: () => string, employees: any[], organization: any, adminEmployee: any) {
  // === Leave Requests ===
  // Create sample leave requests with proper approvedBy information
  
  // Pending leave request (no approver yet)
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

  // Approved leave request (approved by admin)
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[1].id,
      organizationId: organization.id,
      approvedById: adminEmployee.id,
      leaveType: 'SICK',
      startDate: ensureUTCForStorage('2024-11-15T00:00:00+08:00'),
      endDate: ensureUTCForStorage('2024-11-16T23:59:59+08:00'),
      status: 'APPROVED',
      remarks: 'Flu symptoms',
    } as any,
  });

  // Another approved leave request (approved by admin)
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[2]?.id || employees[0].id,
      organizationId: organization.id,
      approvedById: adminEmployee.id,
      leaveType: 'EMERGENCY',
      startDate: ensureUTCForStorage('2024-10-05T00:00:00+08:00'),
      endDate: ensureUTCForStorage('2024-10-05T23:59:59+08:00'),
      status: 'APPROVED',
      remarks: 'Family emergency',
    } as any,
  });

  // Rejected leave request (rejected by admin)
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[3]?.id || employees[1].id,
      organizationId: organization.id,
      approvedById: adminEmployee.id,
      leaveType: 'UNPAID',
      startDate: ensureUTCForStorage('2024-09-10T00:00:00+08:00'),
      endDate: ensureUTCForStorage('2024-09-15T23:59:59+08:00'),
      status: 'REJECTED',
      remarks: 'Insufficient notice period',
    } as any,
  });

  // Cancelled leave request (no approver needed)
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[0].id,
      organizationId: organization.id,
      leaveType: 'VACATION',
      startDate: ensureUTCForStorage('2024-08-01T00:00:00+08:00'),
      endDate: ensureUTCForStorage('2024-08-05T23:59:59+08:00'),
      status: 'CANCELLED',
      remarks: 'Trip cancelled',
    } as any,
  });

  console.log('✅ Created sample leave requests with approvedBy information');
}
