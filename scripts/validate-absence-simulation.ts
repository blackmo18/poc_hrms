import { prisma } from '@/lib/db';
import { format, isWeekend, differenceInDays } from 'date-fns';

/**
 * Validation script to check absence simulation in payroll test data
 * This script analyzes:
 * 1. Random absences (no time entries)
 * 2. Leave requests (approved absences)
 * 3. Correlation between absences and leave requests
 */

async function validateAbsenceSimulation() {
  try {
    console.log('🔍 Validating absence simulation in payroll test data...\n');

    // Get the most recent employee with test data
    const testEmployee = await prisma.employee.findFirst({
      where: {
        email: { contains: 'testpayroll.com' }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        department: true
      }
    });

    if (!testEmployee) {
      console.log('❌ No test employee found. Please run test:payroll:generate first.');
      return;
    }

    console.log(`👤 Analyzing absences for: ${testEmployee.firstName} ${testEmployee.lastName}`);
    console.log(`📧 Email: ${testEmployee.email}\n`);

    // Analyze a specific month (February 2026)
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-02-28');

    console.log(`📅 Period: ${format(startDate, 'MMMM yyyy')}`);
    console.log(`   Start: ${format(startDate, 'yyyy-MM-dd')}`);
    console.log(`   End: ${format(endDate, 'yyyy-MM-dd')}\n`);

    // Get all working days (excluding weekends)
    const workingDays = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) {
        workingDays.push(new Date(currentDate));
      }
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    console.log(`📊 Total working days: ${workingDays.length}\n`);

    // Get time entries for the period
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: testEmployee.id,
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { workDate: 'asc' }
    });

    // Get leave requests for the period
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: testEmployee.id,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      }
    });

    console.log('📋 ABSENCE ANALYSIS:');
    console.log('==================');

    // Find days without time entries (potential absences)
    const daysWithTimeEntries = timeEntries.map(te => format(te.workDate, 'yyyy-MM-dd'));
    const absentDays = workingDays.filter(day => 
      !daysWithTimeEntries.includes(format(day, 'yyyy-MM-dd'))
    );

    console.log(`🕐 Time entries created: ${timeEntries.length}`);
    console.log(`🏖️ Leave requests created: ${leaveRequests.length}`);
    console.log(`❌ Days without time entries: ${absentDays.length}\n`);

    // Analyze absent days
    if (absentDays.length > 0) {
      console.log('📅 ABSENT DAYS (No Time Entries):');
      absentDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const hasLeaveRequest = leaveRequests.some(lr => 
          format(lr.startDate, 'yyyy-MM-dd') === dateStr
        );
        console.log(`   ${dateStr} ${hasLeaveRequest ? '✅ (Has leave request)' : '❌ (No leave request)'}`);
      });
    }

    // Analyze leave requests
    if (leaveRequests.length > 0) {
      console.log('\n🏖️ LEAVE REQUESTS:');
      leaveRequests.forEach(lr => {
        const dateStr = format(lr.startDate, 'yyyy-MM-dd');
        const hasTimeEntry = daysWithTimeEntries.includes(dateStr);
        console.log(`   ${dateStr}: ${lr.leaveType} - ${lr.status} ${hasTimeEntry ? '❌ (Has time entry)' : '✅ (No time entry)'}`);
      });
    }

    // Validation results
    console.log('\n🔍 VALIDATION RESULTS:');
    console.log('=====================');

    const leaveRequestDates = leaveRequests.map(lr => format(lr.startDate, 'yyyy-MM-dd'));
    const unexplainedAbsences = absentDays.filter(day => 
      !leaveRequestDates.includes(format(day, 'yyyy-MM-dd'))
    );

    const conflictingLeaveRequests = leaveRequests.filter(lr => 
      daysWithTimeEntries.includes(format(lr.startDate, 'yyyy-MM-dd'))
    );

    console.log(`✅ Explained absences (with leave requests): ${absentDays.length - unexplainedAbsences.length}`);
    console.log(`❌ Unexplained absences (no leave requests): ${unexplainedAbsences.length}`);
    console.log(`⚠️  Conflicting leave requests (have time entries): ${conflictingLeaveRequests.length}`);

    // Issues found
    const hasIssues = unexplainedAbsences.length > 0 || conflictingLeaveRequests.length > 0;

    if (hasIssues) {
      console.log('\n⚠️  ISSUES FOUND:');
      if (unexplainedAbsences.length > 0) {
        console.log('   - Some absent days do not have corresponding leave requests');
        console.log('   - Random absences (5% chance) are not being documented');
      }
      if (conflictingLeaveRequests.length > 0) {
        console.log('   - Some leave requests have time entries (conflict)');
      }
      
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. Create leave requests for all random absences');
      console.log('   2. Ensure no time entries exist for approved leave days');
      console.log('   3. Consider different types of leave (SICK, VACATION, etc.)');
    } else {
      console.log('\n✅ Perfect! All absences are properly documented with leave requests.');
    }

    console.log('\n📈 ABSENCE RATE:');
    const absenceRate = ((absentDays.length / workingDays.length) * 100).toFixed(1);
    console.log(`   Overall absence rate: ${absenceRate}% (${absentDays.length}/${workingDays.length} days)`);
    
    const expectedRandomAbsences = Math.round(workingDays.length * 0.05);
    console.log(`   Expected random absences (5%): ${expectedRandomAbsences} days`);
    console.log(`   Additional leave requests: ${leaveRequests.length} days`);

  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
validateAbsenceSimulation();
