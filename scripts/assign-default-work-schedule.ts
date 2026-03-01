import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';

/**
 * Script to assign default work schedules to employees who don't have one
 * Usage: npx tsx scripts/assign-default-work-schedule.ts
 */

async function assignDefaultWorkSchedule() {
  try {
    console.log('🔍 Finding employees without work schedules...');
    
    // Find all employees without work schedules
    const employeesWithoutSchedule = await prisma.employee.findMany({
      where: {
        compensations: {
          none: {
            workSchedule: {
              isNot: null
            }
          }
        }
      },
      include: {
        compensations: {
          where: {
            effectiveDate: { lte: new Date() }
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1
        }
      }
    });
    
    if (employeesWithoutSchedule.length === 0) {
      console.log('✅ All employees have work schedules assigned.');
      return;
    }
    
    console.log(`Found ${employeesWithoutSchedule.length} employees without work schedules:`);
    
    // Create default work schedules
    for (const employee of employeesWithoutSchedule) {
      console.log(`  - ${employee.firstName} ${employee.lastName} (${employee.email})`);
      
      // Get the employee's latest compensation
      const compensation = employee.compensations[0];
      if (!compensation) {
        console.log(`    ⚠️  No compensation found for this employee, skipping...`);
        continue;
      }
      
      await prisma.workSchedule.create({
        data: {
          id: generateULID(),
          compensationId: compensation.id,
          organizationId: employee.organizationId,
          defaultStart: '09:00',
          defaultEnd: '18:00',
          workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          restDays: ['SATURDAY', 'SUNDAY'],
          nightShiftStart: '22:00',
          nightShiftEnd: '06:00',
          allowLateDeduction: true,
          gracePeriodMinutes: 15,
          requiredWorkMinutes: 480,
          maxRegularHours: 8,
          maxOvertimeHours: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`\n✅ Successfully assigned default work schedules to ${employeesWithoutSchedule.length} employees.`);
    console.log('\nDefault schedule:');
    console.log('  Monday - Friday: 09:00 to 18:00');
    console.log('  Saturday - Sunday: Off');
    console.log('  Lunch break: 60 minutes');
    console.log('  Late deductions: Enabled');
    console.log('  Overtime: Enabled');
    
  } catch (error) {
    console.error('❌ Error assigning work schedules:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
assignDefaultWorkSchedule();
