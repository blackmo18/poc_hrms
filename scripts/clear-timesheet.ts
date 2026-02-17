import { prisma } from '@/lib/db';

/**
 * Script to clear all working time records (TimeEntry and TimeBreak)
 * Usage: npx ts-node scripts/clear-timesheet.ts
 */

async function clearTimesheetRecords() {
  try {
    console.log('Starting to clear timesheet records...');

    // Delete all TimeBreak records first (due to foreign key constraint)
    const deletedBreaks = await prisma.timeBreak.deleteMany({});
    console.log(`✓ Deleted ${deletedBreaks.count} time break records`);

    // Delete all TimeEntry records
    const deletedEntries = await prisma.timeEntry.deleteMany({});
    console.log(`✓ Deleted ${deletedEntries.count} time entry records`);

    console.log('\n✅ Successfully cleared all timesheet records!');
  } catch (error) {
    console.error('❌ Error clearing timesheet records:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearTimesheetRecords();
