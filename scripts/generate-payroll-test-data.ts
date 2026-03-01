import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';
import bcrypt from 'bcryptjs';
import { format, addDays, addMinutes, setHours, setMinutes, isWeekend, differenceInMinutes } from 'date-fns';
import { seedTaxBrackets } from '../prisma/seeds/taxBrackets';
import { seedPhilhealthContributions } from '../prisma/seeds/philhealthContributions';
import { seedSSSContributions } from '../prisma/seeds/sssContributions';
import { seedPagibigContributions } from '../prisma/seeds/pagibigContributions';

/**
 * Script to generate realistic payroll test data for a given month
 * Creates a new employee with time entries including:
 * - Realistic late arrivals
 * - Overtime records
 * - Absences
 * 
 * Usage: npx ts-node scripts/generate-payroll-test-data.ts [YYYY-MM] [employeeName|employeeEmail]
 * Example with name: npx ts-node scripts/generate-payroll-test-data.ts 2024-01 "John Doe"
 * Example with email: npx ts-node scripts/generate-payroll-test-data.ts 2024-01 "john.doe@testpayroll.com"
 */

interface TimeEntryData {
  clockIn: Date;
  clockOut: Date;
  totalMinutes: number;
  isLate: boolean;
  hasOvertime: boolean;
  lateMinutes?: number;
  overtimeMinutes?: number;
}

// Configuration
const WORK_SCHEDULE = {
  START_HOUR: 9,
  START_MINUTE: 0,
  END_HOUR: 18,
  END_MINUTE: 0,
  LUNCH_START_HOUR: 12,
  LUNCH_START_MINUTE: 0,
  LUNCH_END_HOUR: 13,
  LUNCH_END_MINUTE: 0,
  WORKDAY_MINUTES: 480, // 8 hours (excluding lunch)
};

const PHILIPPINE_HOLIDAYS_2024 = [
  { date: '2024-01-01', name: 'New Year\'s Day', type: 'REGULAR' },
  { date: '2024-04-09', name: 'Araw ng Kagitingan', type: 'REGULAR' },
  { date: '2024-05-01', name: 'Labor Day', type: 'REGULAR' },
  { date: '2024-06-12', name: 'Independence Day', type: 'REGULAR' },
  { date: '2024-08-26', name: 'National Heroes Day', type: 'REGULAR' },
  { date: '2024-11-30', name: 'Bonifacio Day', type: 'REGULAR' },
  { date: '2024-12-25', name: 'Christmas Day', type: 'REGULAR' },
  { date: '2024-12-30', name: 'Rizal Day', type: 'REGULAR' },
  { date: '2024-02-10', name: 'EDSA People Power Revolution', type: 'SPECIAL_NON_WORKING' },
  { date: '2024-04-08', name: 'Day of Valor', type: 'SPECIAL_NON_WORKING' },
  { date: '2024-08-21', name: 'Ninoy Aquino Day', type: 'SPECIAL_NON_WORKING' },
  { date: '2024-11-01', name: 'All Saints\' Day', type: 'SPECIAL_NON_WORKING' },
  { date: '2024-12-08', name: 'Feast of the Immaculate Conception', type: 'SPECIAL_NON_WORKING' },
  { date: '2024-12-24', name: 'Christmas Eve', type: 'SPECIAL_NON_WORKING' },
  { date: '2024-12-31', name: 'New Year\'s Eve', type: 'SPECIAL_NON_WORKING' },
];

async function generatePayrollTestData() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const monthYear = args[0] || format(new Date(), 'yyyy-MM');
    const employeeName = args[1] || 'Test Employee';
    
    const [year, month] = monthYear.split('-').map(Number);
    const targetMonth = new Date(year, month - 1, 1);
    
    console.log(`\n🚀 Generating payroll test data for ${monthYear}`);
    console.log(`👤 Employee: ${employeeName}`);
    console.log(`📅 Period: ${format(targetMonth, 'MMMM yyyy')}\n`);

    // Get or create organization
    const organization = await getOrCreateOrganization();
    
    // Get or create department
    const department = await getOrCreateDepartment(organization.id);
    
    // Get or create job title
    const jobTitle = await getOrCreateJobTitle(organization.id);
    
    // Create new employee
    const employee = await createTestEmployee(organization.id, department.id, jobTitle.id, employeeName);
    
    // Create compensation
    await createCompensation(employee.id, organization.id, department.id);
    
    // Create government info
    await createGovernmentInfo(employee.id, organization.id);
    
    // Create work schedule
    await createWorkSchedule(employee.id, organization.id);
    
    // Create late deduction policies
    await createLateDeductionPolicies(organization.id);
    
    // Generate time entries for the month
    const timeEntries = await generateTimeEntries(employee.id, organization.id, department.id, targetMonth);
    
    // Generate overtime requests
    await generateOvertimeRequests(employee.id, organization.id, timeEntries, targetMonth);
    
    // Generate leave requests (absences)
    await generateLeaveRequests(employee.id, organization.id, department.id, targetMonth);
    
    // Print summary
    printSummary(employee, timeEntries, targetMonth);
    
    console.log('\n✅ Payroll test data generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run payroll generation for the period');
    console.log('2. Verify the calculations include late deductions and overtime pay');
    console.log('3. Check that absences are properly reflected');
    
  } catch (error) {
    console.error('❌ Error generating payroll test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function getOrCreateOrganization() {
  let org = await prisma.organization.findFirst({
    where: { name: 'Test Payroll Organization' }
  });
  
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: generateULID(),
        name: 'Test Payroll Organization',
        email: 'test@payroll.com',
        status: 'ACTIVE',
        updatedAt: new Date(),
      }
    });
    console.log('✓ Created test organization');
  } else {
    console.log('✓ Found existing test organization');
  }
  
  // Always seed government contribution rates for the test organization
  // This ensures they exist even if the organization was already created
  console.log('📊 Seeding government contribution rates...');
  await seedTaxBrackets(prisma, generateULID, org);
  await seedPhilhealthContributions(prisma, generateULID, org);
  await seedSSSContributions(prisma, generateULID, org);
  await seedPagibigContributions(prisma, generateULID, org);
  console.log('✅ Government contribution rates seeded');
  
  return org;
}

async function getOrCreateDepartment(organizationId: string) {
  let dept = await prisma.department.findFirst({
    where: { name: 'Engineering', organizationId }
  });
  
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        id: generateULID(),
        organizationId,
        name: 'Engineering',
        description: 'Software Engineering Department',
        updatedAt: new Date(),
      }
    });
    console.log('✓ Created Engineering department');
  }
  
  return dept;
}

async function getOrCreateJobTitle(organizationId: string) {
  let title = await prisma.jobTitle.findFirst({
    where: { name: 'Software Engineer', organizationId }
  });
  
  if (!title) {
    title = await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organizationId,
        name: 'Software Engineer',
        description: 'Senior Software Engineer',
        updatedAt: new Date(),
      }
    });
    console.log('✓ Created Software Engineer job title');
  }
  
  return title;
}

async function createTestEmployee(organizationId: string, departmentId: string, jobTitleId: string, nameOrEmail: string) {
  let firstName: string;
  let lastName: string;
  let email: string;
  
  // Check if input is an email address
  if (nameOrEmail.includes('@')) {
    email = nameOrEmail;
    // Extract name from email - take everything before @ and split by dot or underscore
    const localPart = nameOrEmail.split('@')[0];
    const nameParts = localPart.split(/[._]/);
    firstName = nameParts[0] || 'Test';
    lastName = nameParts[1] || 'Employee';
    // Capitalize first letters
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
  } else {
    // Traditional name input
    const nameParts = nameOrEmail.split(' ');
    firstName = nameParts[0] || 'Test';
    lastName = nameParts[1] || 'Employee';
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@testpayroll.com`;
  }
  
  const employeeId = `TEST-${Date.now().toString().slice(-4)}`;
  
  // Check if employee already exists (in any organization)
  let employee = await prisma.employee.findFirst({
    where: { email }
  });
  
  if (employee && employee.organizationId !== organizationId) {
    console.log(`⚠️  Employee exists in different organization (${employee.organizationId})`);
    console.log('  Creating new employee in test organization...');
    employee = null; // Force creation of new employee
  }
  
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organizationId,
        departmentId,
        jobTitleId,
        employeeId,
        firstName,
        lastName,
        email,
        hireDate: new Date(new Date().getFullYear() - 1, 0, 15), // Hired a year ago
        employmentStatus: 'ACTIVE',
        updatedAt: new Date(),
      }
    });
    
    // Create associated user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        id: generateULID(),
        organizationId,
        email,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        employeeId: employee.id,
        updatedAt: new Date(),
      } as any
    });
    
    console.log(`✓ Created employee: ${firstName} ${lastName} (${email})`);
  }
  
  return employee;
}

async function createCompensation(employeeId: string, organizationId: string, departmentId: string) {
  const baseSalary = 45000; // PHP 45,000 monthly
  const effectiveDate = new Date(new Date().getFullYear() - 1, 0, 15);
  
  // Check if compensation already exists
  const existingComp = await prisma.compensation.findFirst({
    where: {
      employeeId,
      effectiveDate
    }
  });
  
  if (!existingComp) {
    await prisma.compensation.create({
      data: {
        id: generateULID(),
        employee: { connect: { id: employeeId } },
        organization: { connect: { id: organizationId } },
        department: { connect: { id: departmentId } },
        baseSalary,
        payFrequency: 'MONTHLY',
        employmentType: 'MONTHLY_SALARY',
        effectiveDate,
      }
    });
  }
  
  console.log(`✓ Set compensation: PHP ${baseSalary.toLocaleString()}/month`);
}

async function createGovernmentInfo(employeeId: string, organizationId: string) {
  await prisma.employeeGovernmentInfo.upsert({
    where: { employeeId },
    update: {},
    create: {
      id: generateULID(),
      employeeId,
      organizationId,
      sssNumber: '12-3456789-0',
      philhealthNumber: '12-345678901',
      pagibigNumber: '1234-5678-9012',
      tinNumber: '123-456-789-000',
      updatedAt: new Date(),
    }
  });
  
  console.log('✓ Set government information');
}

async function createWorkSchedule(employeeId: string, organizationId: string) {
  console.log('📅 Creating work schedule for employee...');
  
  // Get the employee's compensation
  const compensation = await prisma.compensation.findFirst({
    where: { employeeId },
  });
  
  if (!compensation) {
    throw new Error(`No compensation found for employee ${employeeId}`);
  }
  
  console.log(`  ✓ Found compensation: ₱${compensation.baseSalary.toLocaleString()}/month`);
  
  // Check if work schedule already exists
  const existingSchedule = await prisma.workSchedule.findFirst({
    where: { compensationId: compensation.id },
  });
  
  if (existingSchedule) {
    console.log('  ⚠️  Work schedule already exists - skipping');
    return;
  }
  
  // Create the work schedule
  const schedule = await prisma.workSchedule.create({
    data: {
      id: generateULID(),
      compensationId: compensation.id,
      organizationId,
      scheduleType: 'FIXED',
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
    },
  });
  
  console.log(`  ✓ Created work schedule: ${schedule.defaultStart} - ${schedule.defaultEnd}`);
  console.log(`  ✓ Work days: ${schedule.workDays.join(', ')}`);
  console.log(`  ✓ Hourly rate: ₱${schedule.hourlyRate.toFixed(2)}`);
  console.log('✓ Work schedule created successfully');
}

async function createLateDeductionPolicies(organizationId: string) {
  console.log('\n📋 Creating late deduction policies...');
  
  // Check if policies already exist
  const existingPolicies = await prisma.lateDeductionPolicy.findMany({
    where: { organizationId }
  });
  
  if (existingPolicies.length > 0) {
    console.log('  ⚠️  Late deduction policies already exist - skipping');
    return;
  }
  
  // Create LATE policy
  const latePolicy = await prisma.lateDeductionPolicy.create({
    data: {
      id: generateULID(),
      organizationId,
      name: 'Standard Late Deduction',
      policyType: 'LATE',
      deductionMethod: 'HOURLY_RATE',
      minimumLateMinutes: 1,
      gracePeriodMinutes: 10,
      fixedAmount: null,
      percentageRate: null,
      hourlyRateMultiplier: 1.0,
      maxDeductionPerDay: 500,
      maxDeductionPerCutoff: 2000,
      isActive: true,
      effectiveDate: new Date(new Date().getFullYear() - 1, 0, 1),
      endDate: null,
    } as any
  });
  
  console.log(`  ✓ Created LATE policy: ₱${latePolicy.maxDeductionPerDay} max/day`);
  console.log('✓ Late deduction policies created successfully');
}

function generateTimeEntryForDay(date: Date): TimeEntryData | null {
  // Skip weekends
  if (isWeekend(date)) {
    return null;
  }
  
  // Check if it's a holiday
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = PHILIPPINE_HOLIDAYS_2024.find(h => h.date === dateStr);
  if (holiday && holiday.type === 'REGULAR') {
    return null; // No time entry for regular holidays
  }
  
  // Randomly decide if employee is absent (5% chance)
  if (Math.random() < 0.05) {
    return null;
  }
  
  // Generate realistic time entry
  const isLate = Math.random() < 0.3; // 30% chance of being late
  const hasOvertime = Math.random() < 0.25; // 25% chance of overtime
  
  let clockIn = setHours(setMinutes(date, WORK_SCHEDULE.START_MINUTE), WORK_SCHEDULE.START_HOUR);
  let clockOut = setHours(setMinutes(date, WORK_SCHEDULE.END_MINUTE), WORK_SCHEDULE.END_HOUR);
  
  // Add late arrival
  let lateMinutes = 0;
  if (isLate) {
    lateMinutes = Math.floor(Math.random() * 30) + 5; // 5-35 minutes late
    clockIn = addMinutes(clockIn, lateMinutes);
  }
  
  // Add overtime
  let overtimeMinutes = 0;
  if (hasOvertime) {
    overtimeMinutes = Math.floor(Math.random() * 120) + 30; // 30-150 minutes overtime
    clockOut = addMinutes(clockOut, overtimeMinutes);
  }
  
  // Calculate total work minutes (excluding lunch)
  const totalMinutes = differenceInMinutes(clockOut, clockIn) - 60; // Subtract 1 hour lunch
  
  return {
    clockIn,
    clockOut,
    totalMinutes,
    isLate,
    hasOvertime,
    lateMinutes: isLate ? lateMinutes : undefined,
    overtimeMinutes: hasOvertime ? overtimeMinutes : undefined,
  };
}

async function generateTimeEntries(employeeId: string, organizationId: string, departmentId: string, targetMonth: Date) {
  console.log(`\n📋 Generating time entries for ${targetMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}...`);

  // Delete existing time entries for this employee and month
  const startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

  const deletedEntries = await prisma.timeEntry.deleteMany({
    where: {
      employeeId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  if (deletedEntries.count > 0) {
    console.log(`  🗑️  Deleted ${deletedEntries.count} existing time entries`);
  }

  const timeEntries: any[] = [];
  let currentDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);

  let totalLateDays = 0;
  let totalOvertimeDays = 0;
  let totalAbsentDays = 0;

  while (currentDate <= endDate) {
    const timeEntryData = generateTimeEntryForDay(currentDate);

    
    if (timeEntryData) {
      const timeEntry = await prisma.timeEntry.create({
        data: {
          id: generateULID(),
          employeeId,
          organizationId,
          departmentId,
          clockInAt: timeEntryData.clockIn,
          clockOutAt: timeEntryData.clockOut,
          workDate: currentDate,
          totalWorkMinutes: timeEntryData.totalMinutes,
          status: 'CLOSED',
          updatedAt: new Date(),
        }
      });
      
      // Create lunch break
      await prisma.timeBreak.create({
        data: {
          id: generateULID(),
          timeEntryId: timeEntry.id,
          organizationId,
          employeeId,
          breakStartAt: setHours(setMinutes(currentDate, WORK_SCHEDULE.LUNCH_START_MINUTE), WORK_SCHEDULE.LUNCH_START_HOUR),
          breakEndAt: setHours(setMinutes(currentDate, WORK_SCHEDULE.LUNCH_END_MINUTE), WORK_SCHEDULE.LUNCH_END_HOUR),
          breakType: 'MEAL',
          isPaid: true,
        }
      });
      
      timeEntries.push({ ...timeEntry, ...timeEntryData });
      
      if (timeEntryData.isLate) totalLateDays++;
      if (timeEntryData.hasOvertime) totalOvertimeDays++;
    } else {
      totalAbsentDays++;
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  console.log(`✓ Generated ${timeEntries.length} time entries`);
  console.log(`  - Late days: ${totalLateDays}`);
  console.log(`  - Overtime days: ${totalOvertimeDays}`);
  console.log(`  - Absent days: ${totalAbsentDays}`);
  
  return timeEntries;
}

async function generateOvertimeRequests(employeeId: string, organizationId: string, timeEntries: any[], targetMonth: Date) {
  console.log(`\n⏰ Generating overtime requests...`);
  
  // Delete existing overtime requests for this employee and month
  const startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  
  const deletedOT = await prisma.overtime.deleteMany({
    where: {
      employeeId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  if (deletedOT.count > 0) {
    console.log(`  🗑️  Deleted ${deletedOT.count} existing overtime requests`);
  }
  
  let overtimeRequestsCreated = 0;
  
  for (const entry of timeEntries) {
    if (entry.hasOvertime && entry.overtimeMinutes && entry.overtimeMinutes > 0) {
      // Create overtime request
      const entryIsWeekend = isWeekend(entry.workDate);
      const otType = entryIsWeekend ? 'REST_DAY' : 'REGULAR_DAY';
      
      await prisma.overtime.create({
        data: {
          id: generateULID(),
          employeeId,
          organizationId,
          workDate: entry.workDate,
          timeEntryId: entry.id,
          timeStart: format(entry.clockOutAt, 'HH:mm'),
          timeEnd: format(addMinutes(entry.clockOutAt, entry.overtimeMinutes), 'HH:mm'),
          otType,
          requestedMinutes: entry.overtimeMinutes,
          approvedMinutes: entry.overtimeMinutes,
          status: 'APPROVED',
          reason: 'Project deadline - Additional development work required',
          remarks: 'Approved by manager',
          approvedAt: new Date(),
          updatedAt: new Date(),
        }
      });
      
      overtimeRequestsCreated++;
    }
  }
  
  console.log(`✓ Created ${overtimeRequestsCreated} overtime requests`);
}

async function generateLeaveRequests(employeeId: string, organizationId: string, departmentId: string, targetMonth: Date) {
  console.log(`\n🏖️ Generating leave requests...`);
  
  // Delete existing leave requests for this employee and month
  const startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  
  const deletedLeave = await prisma.leaveRequest.deleteMany({
    where: {
      employeeId,
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  if (deletedLeave.count > 0) {
    console.log(`  🗑️  Deleted ${deletedLeave.count} existing leave requests`);
  }
  
  // Generate 1-2 sick leave requests for the month
  const numLeaves = Math.floor(Math.random() * 2) + 1;
  
  for (let i = 0; i < numLeaves; i++) {
    // Random day in the month (not weekend)
    let leaveDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.floor(Math.random() * 28) + 1);
    while (isWeekend(leaveDate)) {
      leaveDate = addDays(leaveDate, 1);
    }
    
    await prisma.leaveRequest.create({
      data: {
        id: generateULID(),
        employeeId,
        organizationId,
        departmentId,
        leaveType: 'SICK',
        startDate: leaveDate,
        endDate: leaveDate,
        totalMinutes: 480, // Full day
        isPaid: true,
        status: 'APPROVED',
        remarks: 'Medical appointment - Approved by HR',
        updatedAt: new Date(),
      }
    });
  }
  
  console.log(`✓ Created ${numLeaves} leave requests`);
}

function printSummary(employee: any, timeEntries: any[], targetMonth: Date) {
  const totalWorkMinutes = timeEntries.reduce((sum, entry) => sum + (entry.totalMinutes || 0), 0);
  const totalOvertimeMinutes = timeEntries.reduce((sum, entry) => sum + (entry.overtimeMinutes || 0), 0);
  const totalLateDays = timeEntries.filter(entry => entry.isLate).length;
  
  console.log('\n📊 SUMMARY:');
  console.log('================');
  console.log(`Employee: ${employee.firstName} ${employee.lastName}`);
  console.log(`Email: ${employee.email}`);
  console.log(`Employee ID: ${employee.employeeId}`);
  console.log(`Period: ${format(targetMonth, 'MMMM yyyy')}`);
  console.log('');
  console.log(`Work Days: ${timeEntries.length}`);
  console.log(`Total Work Hours: ${(totalWorkMinutes / 60).toFixed(1)} hours`);
  console.log(`Late Days: ${totalLateDays}`);
  console.log(`Total Overtime: ${(totalOvertimeMinutes / 60).toFixed(1)} hours`);
  console.log('');
  console.log('Expected Payroll Calculation:');
  console.log(`- Base Salary: PHP 45,000.00`);
  if (totalOvertimeMinutes > 0) {
    console.log(`- Overtime Pay: PHP ${(totalOvertimeMinutes * (45000 / 160 / 60) * 1.25).toFixed(2)}`);
  }
  if (totalLateDays > 0) {
    console.log(`- Late Deductions: PHP ${(totalLateDays * 500).toFixed(2)} (estimated)`);
  }
}

// Run the script
generatePayrollTestData();
