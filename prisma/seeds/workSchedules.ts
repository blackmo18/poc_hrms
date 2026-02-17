import { PrismaClient, ScheduleType } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedWorkSchedules(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any,
  employees: any[],
  compensations: any[]
) {
  console.log('🌱 Seeding work schedules...');

  const schedules = [];

  // Create schedules for each employee with compensation
  for (const employee of employees) {
    const compensation = compensations.find(c => c.employeeId === employee.id);
    if (!compensation) {
      console.log(`No compensation found for employee ${employee.id} - skipping schedule`);
      continue;
    }

    // Check if schedule already exists for this compensation
    const existingSchedule = await prisma.workSchedule.findFirst({
      where: { compensationId: compensation.id },
    });

    if (existingSchedule) {
      console.log(`Schedule already exists for employee ${employee.id} - skipping`);
      continue;
    }

    // Determine schedule type based on employee index
    let schedule;
    
    if (employee.id === employees[2].id) {
      // Night shift schedule for third employee
      schedule = {
        id: generateULID(),
        compensationId: compensation.id,
        organizationId: organization.id,
        scheduleType: ScheduleType.FIXED,
        defaultStart: '22:00',
        defaultEnd: '07:00',
        workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        restDays: ['SATURDAY', 'SUNDAY'],
        overtimeRate: 1.25,
        restDayRate: 1.30,
        holidayRate: 1.30,
        specialHolidayRate: 1.30,
        doubleHolidayRate: 2.00,
        nightShiftStart: '22:00',
        nightShiftEnd: '06:00',
        nightDiffRate: 0.10,
        isMonthlyRate: true,
        monthlyRate: compensation.baseSalary + 2000, // Night shift differential
        dailyRate: (compensation.baseSalary + 2000) / 22,
        hourlyRate: (compensation.baseSalary + 2000) / 22 / 8,
        gracePeriodMinutes: 5,
        requiredWorkMinutes: 540, // 9 hours with 1 hour break
        maxRegularHours: 9,
        maxOvertimeHours: 3,
        allowLateDeduction: true,
        maxDeductionPerDay: 500,
        maxDeductionPerMonth: 2000,
      };
    } else if (employee.id === employees[0].id || employee.id === employees[1].id) {
      // Flexible schedule for first two employees
      schedule = {
        id: generateULID(),
        compensationId: compensation.id,
        organizationId: organization.id,
        scheduleType: ScheduleType.FLEXIBLE,
        workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        restDays: ['SATURDAY', 'SUNDAY'],
        overtimeRate: 1.25,
        restDayRate: 1.30,
        holidayRate: 1.30,
        specialHolidayRate: 1.30,
        doubleHolidayRate: 2.00,
        nightShiftStart: '22:00',
        nightShiftEnd: '06:00',
        nightDiffRate: 0.10,
        coreHoursStart: '10:00',
        coreHoursEnd: '16:00',
        totalHoursPerWeek: 40,
        isMonthlyRate: true,
        monthlyRate: compensation.baseSalary,
        dailyRate: compensation.baseSalary / 22,
        hourlyRate: compensation.baseSalary / 22 / 8,
        gracePeriodMinutes: 15,
        requiredWorkMinutes: 480,
        maxRegularHours: 8,
        maxOvertimeHours: 3,
        allowLateDeduction: false, // Flexible schedule doesn't have late deductions
        isFlexibleSchedule: true,
        minHoursPerDay: 6,
        maxHoursPerDay: 10,
        canLogAnyHours: false,
      };
    } else {
      // Regular office schedule for others
      schedule = {
        id: generateULID(),
        compensationId: compensation.id,
        organizationId: organization.id,
        scheduleType: ScheduleType.FIXED,
        defaultStart: '09:00',
        defaultEnd: '18:00',
        workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        restDays: ['SATURDAY', 'SUNDAY'],
        overtimeRate: 1.25,
        restDayRate: 1.30,
        holidayRate: 1.30,
        specialHolidayRate: 1.30,
        doubleHolidayRate: 2.00,
        nightShiftStart: '22:00',
        nightShiftEnd: '06:00',
        nightDiffRate: 0.10,
        isMonthlyRate: true,
        monthlyRate: compensation.baseSalary,
        dailyRate: compensation.baseSalary / 22,
        hourlyRate: compensation.baseSalary / 22 / 8,
        gracePeriodMinutes: 10,
        requiredWorkMinutes: 480,
        maxRegularHours: 8,
        maxOvertimeHours: 3,
        allowLateDeduction: true,
        maxDeductionPerDay: 500,
        maxDeductionPerMonth: 2000,
      };
    }

    schedules.push(schedule);
  }

  for (const schedule of schedules) {
    await prisma.workSchedule.create({
      data: schedule,
    });
  }

  console.log(`✅ Created ${schedules.length} work schedules`);
  return schedules;
}
