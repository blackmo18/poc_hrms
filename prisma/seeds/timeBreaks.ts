import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

const prisma = new PrismaClient();

/**
 * Seeds time break data for testing breakEndAt functionality
 * Creates breaks with various scenarios: paid, unpaid, completed, incomplete
 */
export async function seedTimeBreaks() {
  console.log('🕐 Seeding time breaks...');

  // Get time entries to associate breaks with
  const timeEntries = await prisma.timeEntry.findMany({
    take: 10, // Limit to 10 time entries for testing
    include: {
      employee: true,
    }
  });

  if (timeEntries.length === 0) {
    console.log('⚠️  No time entries found, skipping break seeding');
    return;
  }

  const breaksData = [];

  for (const timeEntry of timeEntries) {
    const workDate = timeEntry.workDate;
    const clockIn = timeEntry.clockInAt;
    const clockOut = timeEntry.clockOutAt;

    if (!clockOut) continue; // Skip open time entries

    // Create different break scenarios based on the day
    const dayOfWeek = workDate.getDay();
    
    // Scenario 1: Lunch break (paid, complete)
    const lunchStart = new Date(workDate);
    lunchStart.setHours(12, 0, 0, 0);
    const lunchEnd = new Date(workDate);
    lunchEnd.setHours(13, 0, 0, 0);

    // Only add lunch break if it falls within work hours
    if (lunchStart >= clockIn && lunchEnd <= clockOut) {
      breaksData.push({
        id: generateULID(),
        timeEntryId: timeEntry.id,
        organizationId: timeEntry.organizationId,
        employeeId: timeEntry.employeeId,
        breakType: 'MEAL',
        breakStartAt: lunchStart,
        breakEndAt: lunchEnd,
        isPaid: true,
        durationMinutes: 60,
      });
    }

    // Scenario 2: Coffee break (unpaid, complete) - for some days
    if (dayOfWeek % 2 === 0) { // Every other day
      const coffeeStart = new Date(workDate);
      coffeeStart.setHours(15, 0, 0, 0);
      const coffeeEnd = new Date(workDate);
      coffeeEnd.setHours(15, 15, 0, 0);

      if (coffeeStart >= clockIn && coffeeEnd <= clockOut) {
        breaksData.push({
          id: generateULID(),
          timeEntryId: timeEntry.id,
          organizationId: timeEntry.organizationId,
          employeeId: timeEntry.employeeId,
          breakType: 'REST',
          breakStartAt: coffeeStart,
          breakEndAt: coffeeEnd,
          isPaid: false,
          durationMinutes: 15,
        });
      }
    }

    // Scenario 3: Incomplete break (no end time) - for testing
    if (dayOfWeek === 3) { // Wednesday
      const incompleteStart = new Date(workDate);
      incompleteStart.setHours(10, 30, 0, 0);

      if (incompleteStart >= clockIn && incompleteStart <= clockOut) {
        breaksData.push({
          id: generateULID(),
          timeEntryId: timeEntry.id,
          organizationId: timeEntry.organizationId,
          employeeId: timeEntry.employeeId,
          breakType: 'PERSONAL',
          breakStartAt: incompleteStart,
          breakEndAt: null, // Incomplete break
          isPaid: false,
          durationMinutes: null,
        });
      }
    }

    // Scenario 4: Multiple short breaks (paid) - for overtime days
    if (dayOfWeek === 5) { // Friday (often overtime day)
      // Morning break
      const morningStart = new Date(workDate);
      morningStart.setHours(10, 0, 0, 0);
      const morningEnd = new Date(workDate);
      morningEnd.setHours(10, 10, 0, 0);

      if (morningStart >= clockIn && morningEnd <= clockOut) {
        breaksData.push({
          id: generateULID(),
          timeEntryId: timeEntry.id,
          organizationId: timeEntry.organizationId,
          employeeId: timeEntry.employeeId,
          breakType: 'REST',
          breakStartAt: morningStart,
          breakEndAt: morningEnd,
          isPaid: true,
          durationMinutes: 10,
        });

        // Afternoon break
        const afternoonStart = new Date(workDate);
        afternoonStart.setHours(16, 0, 0, 0);
        const afternoonEnd = new Date(workDate);
        afternoonEnd.setHours(16, 5, 0, 0);

        if (afternoonStart >= clockIn && afternoonEnd <= clockOut) {
          breaksData.push({
            id: generateULID(),
            timeEntryId: timeEntry.id,
            organizationId: timeEntry.organizationId,
            employeeId: timeEntry.employeeId,
            breakType: 'REST',
            breakStartAt: afternoonStart,
            breakEndAt: afternoonEnd,
            isPaid: true,
            durationMinutes: 5,
          });
        }
      }
    }
  }

  // Delete existing breaks for these time entries
  const timeEntryIds = timeEntries.map(te => te.id);
  await prisma.timeBreak.deleteMany({
    where: {
      timeEntryId: {
        in: timeEntryIds
      }
    }
  });

  // Create new breaks
  if (breaksData.length > 0) {
    await prisma.timeBreak.createMany({
      data: breaksData,
    });

    console.log(`✅ Created ${breaksData.length} time break records`);
    
    // Summary by type
    const paidBreaks = breaksData.filter(b => b.isPaid && b.breakEndAt).length;
    const unpaidBreaks = breaksData.filter(b => !b.isPaid && b.breakEndAt).length;
    const incompleteBreaks = breaksData.filter(b => b.breakEndAt === null).length;
    
    console.log(`   - Paid breaks: ${paidBreaks}`);
    console.log(`   - Unpaid breaks: ${unpaidBreaks}`);
    console.log(`   - Incomplete breaks: ${incompleteBreaks}`);
  } else {
    console.log('ℹ️  No breaks created (work hours may not accommodate break schedules)');
  }

  console.log('✅ Time breaks seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedTimeBreaks()
    .catch((e) => {
      console.error('❌ Error seeding time breaks:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
