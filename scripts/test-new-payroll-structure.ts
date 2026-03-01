import { PrismaClient, PayrollEarningType } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

const prisma = new PrismaClient();

async function testNewPayrollStructure() {
  console.log('🧪 Testing new payroll structure...');

  try {
    // Get existing data
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('No organization found. Please run seed first.');
    }

    // Get employees with all related data
    const employees = await prisma.employee.findMany({
      where: { organizationId: organization.id },
      take: 3,
      include: {
        compensations: {
          orderBy: { effectiveDate: 'desc' },
          take: 1,
          include: {
            workSchedule: true, // Include workSchedule through compensation
          },
        },
        governmentInfo: true,
        department: true,
        jobTitle: true,
      },
    });

    if (employees.length === 0) {
      throw new Error('No employees found. Please run seed first.');
    }

    // Get current payroll period
    let currentPeriod = await prisma.payrollPeriod.findFirst({
      where: {
        organizationId: organization.id,
        status: 'PROCESSING',
      },
    });

    if (!currentPeriod) {
      // Create a test period if none exists
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const payDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
      
      const newPeriod = await prisma.payrollPeriod.create({
        data: {
          startDate,
          endDate,
          organizationId: organization.id,
          payDate,
          status: 'PROCESSING',
          type: 'MONTHLY',
          year: today.getFullYear(),
          month: today.getMonth() + 1,
          periodNumber: 1,
        },
      });
      
      console.log(`Created test payroll period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    }

    // Get active deduction policies
    const deductionPolicies = await prisma.lateDeductionPolicy.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
    });

    console.log(`\n📊 Test Data Summary:`);
    console.log(`- Employees: ${employees.length}`);
    console.log(`- Deduction Policies: ${deductionPolicies.length}`);
    console.log(`- Payroll Period: ${currentPeriod.startDate.toISOString().split('T')[0]} to ${currentPeriod.endDate.toISOString().split('T')[0]}`);

    // Generate payroll for each employee
    for (const employee of employees) {
      console.log(`\n👤 Processing: ${employee.firstName} ${employee.lastName}`);
      
      if (!employee.compensations || employee.compensations.length === 0) {
        console.log(`  ⚠️  No compensation found - skipping`);
        continue;
      }

      const compensation = employee.compensations[0];
      
      if (!compensation.workSchedule) {
        console.log(`  ⚠️  No work schedule found - using default schedule`);
      }

      // Create payroll record
      const payroll = await prisma.payroll.create({
        data: {
          id: generateULID(),
          employeeId: employee.id,
          organizationId: organization.id,
          periodStart: currentPeriod.startDate,
          periodEnd: currentPeriod.endDate,
          grossPay: 0,
          netPay: 0,
          totalDeductions: 0,
        },
      });

      // Calculate rates
      const monthlyRate = compensation.baseSalary;
      const dailyRate = monthlyRate / 22;
      const hourlyRate = dailyRate / 8;

      console.log(`  💰 Base Salary: ₱${monthlyRate.toFixed(2)}`);
      console.log(`  💵 Hourly Rate: ₱${hourlyRate.toFixed(2)}`);

      // Generate earnings
      const earnings = [];

      // Base salary earnings
      const baseSalaryEarning = await prisma.payrollEarning.create({
        data: {
          id: generateULID(),
          payrollId: payroll.id,
          organizationId: organization.id,
          employeeId: employee.id,
          type: PayrollEarningType.BASE_SALARY,
          hours: 176, // 22 days * 8 hours
          rate: hourlyRate,
          amount: monthlyRate,
        },
      });
      earnings.push(baseSalaryEarning);

      // Add overtime for some employees
      if (Math.random() > 0.5) {
        const overtimeHours = Math.floor(Math.random() * 10) + 1;
        const overtimeEarning = await prisma.payrollEarning.create({
          data: {
            id: generateULID(),
            payrollId: payroll.id,
            organizationId: organization.id,
            employeeId: employee.id,
            type: PayrollEarningType.OVERTIME,
            hours: overtimeHours,
            rate: hourlyRate * 1.25,
            amount: overtimeHours * hourlyRate * 1.25,
          },
        });
        earnings.push(overtimeEarning);
        console.log(`  ⏰ Overtime: ${overtimeHours}h = ₱${overtimeEarning.amount.toFixed(2)}`);
      }

      // Add night differential for night shift employees
      const workSchedule = compensation.workSchedule;
      
      // Only check for night shift if work schedule exists
      if (workSchedule && workSchedule.defaultStart && workSchedule.defaultStart.includes('22:00')) {
        console.log(`  🌙 Employee is on night shift`);
        const nightDiffHours = 40; // Assume 40 hours of night shift
        const nightDiffEarning = await prisma.payrollEarning.create({
          data: {
            id: generateULID(),
            payrollId: payroll.id,
            organizationId: organization.id,
            employeeId: employee.id,
            type: PayrollEarningType.NIGHT_DIFFERENTIAL,
            hours: nightDiffHours,
            rate: hourlyRate * 0.10, // 10% night differential
            amount: nightDiffHours * hourlyRate * 0.10,
          },
        });
        earnings.push(nightDiffEarning);
        console.log(`  🌙 Night Differential: ${nightDiffHours}h = ₱${nightDiffEarning.amount.toFixed(2)}`);
      }

      // Generate deductions
      const deductions = [];
      let totalDeductions = 0;

      // Government deductions
      if (employee.governmentInfo) {
        // SSS
        const sssDeduction = Math.min(monthlyRate * 0.045, 900);
        const sss = await prisma.deduction.create({
          data: {
            id: generateULID(),
            payrollId: payroll.id,
            organizationId: organization.id,
            employeeId: employee.id,
            type: 'SSS',
            amount: sssDeduction,
          },
        });
        deductions.push(sss);
        totalDeductions += sssDeduction;

        // PhilHealth
        const philhealthDeduction = Math.min(monthlyRate * 0.05, 900);
        const philhealth = await prisma.deduction.create({
          data: {
            id: generateULID(),
            payrollId: payroll.id,
            organizationId: organization.id,
            employeeId: employee.id,
            type: 'PHILHEALTH',
            amount: philhealthDeduction,
          },
        });
        deductions.push(philhealth);
        totalDeductions += philhealthDeduction;

        // Pagibig
        const pagibigDeduction = Math.min(monthlyRate * 0.02, 100);
        const pagibig = await prisma.deduction.create({
          data: {
            id: generateULID(),
            payrollId: payroll.id,
            organizationId: organization.id,
            employeeId: employee.id,
            type: 'PAGIBIG',
            amount: pagibigDeduction,
          },
        });
        deductions.push(pagibig);
        totalDeductions += pagibigDeduction;

        console.log(`  🏥 Gov't Deductions: SSS=₱${sssDeduction.toFixed(2)}, PH=₱${philhealthDeduction.toFixed(2)}, PAG=₱${pagibigDeduction.toFixed(2)}`);
      }

      // Tax calculation (simplified)
      const taxableIncome = monthlyRate - totalDeductions;
      let tax = 0;
      if (taxableIncome > 20833) {
        tax = (taxableIncome - 20833) * 0.20;
      }
      if (taxableIncome > 33333) {
        tax = 2500 + (taxableIncome - 33333) * 0.25;
      }
      
      const taxDeduction = await prisma.deduction.create({
        data: {
          id: generateULID(),
          payrollId: payroll.id,
          organizationId: organization.id,
          employeeId: employee.id,
          type: 'TAX',
          amount: tax,
        },
      });
      deductions.push(taxDeduction);
      totalDeductions += tax;

      // Apply late deduction policy
      if (Math.random() > 0.7 && deductionPolicies.length > 0) {
        const policy = deductionPolicies[0];
        const lateAmount = policy.fixedAmount || 100;
        const lateDeduction = await prisma.deduction.create({
          data: {
            id: generateULID(),
            payrollId: payroll.id,
            organizationId: organization.id,
            employeeId: employee.id,
            type: 'LATE',
            amount: lateAmount,
          },
        });
        deductions.push(lateDeduction);
        totalDeductions += lateAmount;
        console.log(`  ⏰ Late Deduction (${policy.name}): ₱${lateAmount.toFixed(2)}`);
      }

      // Calculate totals
      const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
      const grossPay = totalEarnings;
      const netPay = grossPay - totalDeductions;

      // Update payroll with totals
      await prisma.payroll.update({
        where: { id: payroll.id },
        data: {
          grossPay,
          netPay,
          totalDeductions,
          processedAt: new Date(),
        },
      });

      console.log(`  📈 Payroll Summary:`);
      console.log(`     Gross Pay: ₱${grossPay.toFixed(2)}`);
      console.log(`     Total Deductions: ₱${totalDeductions.toFixed(2)}`);
      console.log(`     Net Pay: ₱${netPay.toFixed(2)}`);
      console.log(`     Earnings Records: ${earnings.length}`);
      console.log(`     Deduction Records: ${deductions.length}`);
    }

    console.log('\n✅ Test payroll data generated successfully!');
    console.log('\n📝 You can now test the payroll APIs with the generated data.');
    console.log('   - Check payroll summaries');
    console.log('   - View earning breakdowns');
    console.log('   - Review deduction details');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testNewPayrollStructure();
