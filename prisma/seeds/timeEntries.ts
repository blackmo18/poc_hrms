import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { ensureUTCForStorage } from '@/lib/utils/timezone-utils';

const prisma = new PrismaClient();

/**
 * Seeds time entries for testing payroll calculations
 * Includes present days, late days, and absent days
 * Uses local ISO dates converted to UTC for storage (mimicking backend behavior)
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
  // Use local ISO dates (assumed Manila timezone)
  const testPeriod = {
    start: '2026-02-01',
    end: '2026-02-15',
  };

  for (const employee of employees) {
    console.log(`📝 Creating time entries for ${employee.firstName} ${employee.lastName}...`);

    // Create time entries with various scenarios
    const timeEntries = [];

    // Feb 2 (Monday) - Present
    // Local ISO dates (Manila timezone)
    const feb2ClockInLocal = '2026-02-02T08:55:00+08:00';
    const feb2ClockOutLocal = '2026-02-02T17:05:00+08:00';
    const feb2WorkDateLocal = '2026-02-02';
    
    // Convert to UTC for storage (mimicking backend behavior)
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb2ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb2ClockOutLocal),
      workDate: ensureUTCForStorage(feb2WorkDateLocal),
      totalWorkMinutes: 480, // 8 hours
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 3 (Tuesday) - Present
    const feb3ClockInLocal = '2026-02-03T08:45:00+08:00';
    const feb3ClockOutLocal = '2026-02-03T17:00:00+08:00';
    const feb3WorkDateLocal = '2026-02-03';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb3ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb3ClockOutLocal),
      workDate: ensureUTCForStorage(feb3WorkDateLocal),
      totalWorkMinutes: 480,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 4 (Wednesday) - Late (15 minutes late, exceeds 10 min grace for regular schedule)
    const feb4ClockInLocal = '2026-02-04T09:15:00+08:00'; // 15 minutes late
    const feb4ClockOutLocal = '2026-02-04T17:00:00+08:00';
    const feb4WorkDateLocal = '2026-02-04';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb4ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb4ClockOutLocal),
      workDate: ensureUTCForStorage(feb4WorkDateLocal),
      totalWorkMinutes: 465, // 7h45m
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 5 (Thursday) - Absent (no time entry)
    // Feb 6 (Friday) - Present
    const feb6ClockInLocal = '2026-02-06T08:50:00+08:00';
    const feb6ClockOutLocal = '2026-02-06T17:10:00+08:00';
    const feb6WorkDateLocal = '2026-02-06';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb6ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb6ClockOutLocal),
      workDate: ensureUTCForStorage(feb6WorkDateLocal),
      totalWorkMinutes: 480,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 9 (Monday) - Present
    const feb9ClockInLocal = '2026-02-09T09:00:00+08:00';
    const feb9ClockOutLocal = '2026-02-09T17:00:00+08:00';
    const feb9WorkDateLocal = '2026-02-09';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb9ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb9ClockOutLocal),
      workDate: ensureUTCForStorage(feb9WorkDateLocal),
      totalWorkMinutes: 480,
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 10 (Tuesday) - Late (30 minutes late, exceeds 10 min grace for regular schedule)
    const feb10ClockInLocal = '2026-02-10T09:30:00+08:00'; // 30 minutes late
    const feb10ClockOutLocal = '2026-02-10T17:00:00+08:00';
    const feb10WorkDateLocal = '2026-02-10';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb10ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb10ClockOutLocal),
      workDate: ensureUTCForStorage(feb10WorkDateLocal),
      totalWorkMinutes: 450, // 7h30m
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 11 (Wednesday) - Present
    const feb11ClockInLocal = '2026-02-11T08:40:00+08:00';
    const feb11ClockOutLocal = '2026-02-11T17:15:00+08:00';
    const feb11WorkDateLocal = '2026-02-11';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb11ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb11ClockOutLocal),
      workDate: ensureUTCForStorage(feb11WorkDateLocal),
      totalWorkMinutes: 495, // 8h15m
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Feb 12 (Thursday) - Absent (no time entry)
    // Feb 13 (Friday) - Present with overtime
    const feb13ClockInLocal = '2026-02-13T08:45:00+08:00';
    const feb13ClockOutLocal = '2026-02-13T19:00:00+08:00'; // 2 hours overtime
    const feb13WorkDateLocal = '2026-02-13';
    
    timeEntries.push({
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department?.organizationId || '',
      clockInAt: ensureUTCForStorage(feb13ClockInLocal),
      clockOutAt: ensureUTCForStorage(feb13ClockOutLocal),
      workDate: ensureUTCForStorage(feb13WorkDateLocal),
      totalWorkMinutes: 600, // 10 hours
      status: 'CLOSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Delete existing time entries for this employee in the test period
    await prisma.timeEntry.deleteMany({
      where: {
        employeeId: employee.id,
        workDate: {
          gte: ensureUTCForStorage(testPeriod.start),
          lte: ensureUTCForStorage(testPeriod.end),
        },
      },
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
