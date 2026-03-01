import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

const prisma = new PrismaClient();

export async function seedPayrolls() {
  console.log('🌱 Seeding payrolls...');

  // Get test data
  const organizations = await prisma.organization.findMany({
    select: { id: true }
  });

  const employees = await prisma.employee.findMany({
    include: {
      department: true,
      compensations: {
        where: { effectiveDate: { lte: new Date() } },
        orderBy: { effectiveDate: 'desc' },
        take: 1
      }
    }
  });

  const payrollPeriods = await prisma.payrollPeriod.findMany({
    take: 2 // Use last 2 periods
  });

  const users = await prisma.user.findMany({
    take: 3
  });

  if (employees.length === 0 || payrollPeriods.length === 0) {
    console.log('⚠️  No employees or payroll periods found, skipping payroll seeding');
    return;
  }

  // Create test payrolls with different statuses
  const payrollData = [];

  for (const period of payrollPeriods) {
    for (const employee of employees.slice(0, 5)) { // Limit to 5 employees per period
      if (!employee.compensations[0]) continue;

      const baseSalary = employee.compensations[0].baseSalary;
      const grossPay = baseSalary;
      const taxDeduction = grossPay * 0.1; // Simplified tax
      const sssDeduction = grossPay * 0.045; // 4.5% SSS
      const philhealthDeduction = grossPay * 0.03; // 3% Philhealth
      const pagibigDeduction = grossPay * 0.02; // 2% Pagibig
      const totalDeductions = taxDeduction + sssDeduction + philhealthDeduction + pagibigDeduction;
      const netPay = grossPay - totalDeductions;

      // Create different statuses for testing
      const statuses = ['COMPUTED', 'APPROVED', 'RELEASED', 'VOIDED'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const payroll = {
        id: generateULID(),
        employeeId: employee.id,
        organizationId: employee.department?.organizationId || organizations[0].id,
        departmentId: employee.departmentId,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        grossPay,
        netPay,
        taxableIncome: grossPay,
        taxDeduction,
        philhealthDeduction,
        sssDeduction,
        pagibigDeduction,
        totalDeductions,
        processedAt: new Date(),
        status: randomStatus as any,
        approvedAt: randomStatus === 'APPROVED' || randomStatus === 'RELEASED' ? new Date() : null,
        approvedBy: randomStatus === 'APPROVED' || randomStatus === 'RELEASED' ? randomUser.id : null,
        releasedAt: randomStatus === 'RELEASED' ? new Date() : null,
        releasedBy: randomStatus === 'RELEASED' ? randomUser.id : null,
        voidedAt: randomStatus === 'VOIDED' ? new Date() : null,
        voidedBy: randomStatus === 'VOIDED' ? randomUser.id : null,
        voidReason: randomStatus === 'VOIDED' ? 'Test void reason' : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      payrollData.push(payroll);
    }
  }

  // Insert payrolls
  await prisma.payroll.createMany({
    data: payrollData,
    skipDuplicates: true
  });

  console.log(`✅ Created ${payrollData.length} payroll records`);

  // Create payroll earnings
  const earningsData = [];
  for (const payroll of payrollData.filter(p => p.status !== 'VOIDED')) {
    // Basic salary earning
    earningsData.push({
      id: generateULID(),
      payrollId: payroll.id,
      organizationId: payroll.organizationId,
      employeeId: payroll.employeeId,
      type: 'BASE_SALARY' as any,
      hours: 160, // Standard monthly hours
      rate: payroll.grossPay / 160,
      amount: payroll.grossPay
    });

    // Overtime earning (30% chance)
    if (Math.random() > 0.7) {
      const overtimeHours = Math.floor(Math.random() * 20) + 1;
      const overtimeRate = (payroll.grossPay / 160) * 1.25;
      earningsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId: payroll.organizationId,
        employeeId: payroll.employeeId,
        type: 'OVERTIME' as any,
        hours: overtimeHours,
        rate: overtimeRate,
        amount: overtimeHours * overtimeRate
      });
    }
  }

  await prisma.payrollEarning.createMany({
    data: earningsData,
    skipDuplicates: true
  });

  console.log(`✅ Created ${earningsData.length} payroll earning records`);

  // Create deductions
  const deductionsData = [];
  for (const payroll of payrollData.filter(p => p.status !== 'VOIDED')) {
    // Tax deduction
    if (payroll.taxDeduction > 0) {
      deductionsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId: payroll.organizationId,
        employeeId: payroll.employeeId,
        type: 'TAX',
        amount: payroll.taxDeduction,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // SSS deduction
    if (payroll.sssDeduction > 0) {
      deductionsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId: payroll.organizationId,
        employeeId: payroll.employeeId,
        type: 'SSS',
        amount: payroll.sssDeduction,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Philhealth deduction
    if (payroll.philhealthDeduction > 0) {
      deductionsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId: payroll.organizationId,
        employeeId: payroll.employeeId,
        type: 'PHILHEALTH',
        amount: payroll.philhealthDeduction,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Pagibig deduction
    if (payroll.pagibigDeduction > 0) {
      deductionsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId: payroll.organizationId,
        employeeId: payroll.employeeId,
        type: 'PAGIBIG',
        amount: payroll.pagibigDeduction,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  await prisma.deduction.createMany({
    data: deductionsData,
    skipDuplicates: true
  });

  console.log(`✅ Created ${deductionsData.length} deduction records`);

  // Create payroll logs
  const logsData = [];
  for (const payroll of payrollData) {
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // Initial generation log
    logsData.push({
      id: generateULID(),
      payrollId: payroll.id,
      action: 'GENERATED',
      previousStatus: null,
      newStatus: payroll.status,
      userId: randomUser.id,
      timestamp: payroll.createdAt
    });

    // Status change logs
    if (payroll.status === 'APPROVED' && payroll.approvedAt) {
      logsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        action: 'APPROVED',
        previousStatus: 'COMPUTED',
        newStatus: 'APPROVED',
        userId: payroll.approvedBy!,
        timestamp: payroll.approvedAt
      });
    }

    if (payroll.status === 'RELEASED' && payroll.releasedAt) {
      logsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        action: 'RELEASED',
        previousStatus: 'APPROVED',
        newStatus: 'RELEASED',
        userId: payroll.releasedBy!,
        timestamp: payroll.releasedAt
      });
    }

    if (payroll.status === 'VOIDED' && payroll.voidedAt) {
      logsData.push({
        id: generateULID(),
        payrollId: payroll.id,
        action: 'VOIDED',
        previousStatus: 'COMPUTED',
        newStatus: 'VOIDED',
        reason: payroll.voidReason,
        userId: payroll.voidedBy!,
        timestamp: payroll.voidedAt
      });
    }
  }

  await (prisma as any).payrollLog.createMany({
    data: logsData,
    skipDuplicates: true
  });

  console.log(`✅ Created ${logsData.length} payroll log records`);
}

// Run if called directly
if (require.main === module) {
  seedPayrolls()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
