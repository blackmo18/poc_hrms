import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

const prisma = new PrismaClient();

/**
 * Seeds time entries for testing payroll calculations
 * Includes present days, late days, and absent days
 */
export async function seedTimeEntries() {
  console.log('🕐 Seeding time entries...');

  // Get employees with their organizations
  const employees = await prisma.employee.findMany({
    include: {
      department: true,
    },
    take: 5, // Limit to 5 employees for testing
  });

  // February 2026 test data (1-15)
  const testPeriod = {
    start: new Date('2026-02-01'),
    end: new Date('2026-02-15'),
  };

  for (const employee of employees) {
    console.log(`📝 Creating time entries for ${employee.firstName} ${employee.lastName}...`);

    // Create time entries with various scenarios
    const timeEntries = [];

    // Feb 2 (Monday) - Present
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-02T08:55:00'),
      clockOutAt: new Date('2026-02-02T17:05:00'),
      workDate: new Date('2026-02-02'),
      totalWorkMinutes: 480, // 8 hours
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 3 (Tuesday) - Present
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-03T08:45:00'),
      clockOutAt: new Date('2026-02-03T17:00:00'),
      workDate: new Date('2026-02-03'),
      totalWorkMinutes: 480,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 4 (Wednesday) - Late (15 minutes late, exceeds 10 min grace for regular schedule)
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-04T09:15:00'), // 15 minutes late (exceeds 10 min grace)
      clockOutAt: new Date('2026-02-04T17:00:00'),
      workDate: new Date('2026-02-04'),
      totalWorkMinutes: 465, // 7h45m
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 5 (Thursday) - Absent (no time entry)
    // Feb 6 (Friday) - Present
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-06T08:50:00'),
      clockOutAt: new Date('2026-02-06T17:10:00'),
      workDate: new Date('2026-02-06'),
      totalWorkMinutes: 480,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 9 (Monday) - Present
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-09T09:00:00'),
      clockOutAt: new Date('2026-02-09T17:00:00'),
      workDate: new Date('2026-02-09'),
      totalWorkMinutes: 480,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 10 (Tuesday) - Late (30 minutes late, exceeds 10 min grace for regular schedule)
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-10T09:30:00'), // 30 minutes late (exceeds 10 min grace)
      clockOutAt: new Date('2026-02-10T17:00:00'),
      workDate: new Date('2026-02-10'),
      totalWorkMinutes: 450, // 7h30m
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 11 (Wednesday) - Present
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-11T08:40:00'),
      clockOutAt: new Date('2026-02-11T17:15:00'),
      workDate: new Date('2026-02-11'),
      totalWorkMinutes: 495, // 8h15m
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 12 (Thursday) - Absent (no time entry)
    // Feb 13 (Friday) - Present with overtime
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      departmentId: employee.departmentId,
      clockInAt: new Date('2026-02-13T08:45:00'),
      clockOutAt: new Date('2026-02-13T19:00:00'), // 2 hours overtime
      workDate: new Date('2026-02-13'),
      totalWorkMinutes: 600, // 10 hours
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create all time entries for this employee
    await prisma.timeEntry.createMany({
      data: timeEntries,
    });

    console.log(`✅ Created ${timeEntries.length} time entries for ${employee.firstName} ${employee.lastName}`);
    console.log(`   - Present: 7 days`);
    console.log(`   - Absent: 2 days (Feb 5, Feb 12)`);
    console.log(`   - Late: 2 days (Feb 4, Feb 10)`);
  }

  console.log('✅ Time entries seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedTimeEntries()
    .catch((e) => {
      console.error('❌ Error seeding time entries:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
