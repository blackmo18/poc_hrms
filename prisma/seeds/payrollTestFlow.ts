import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

// Define PayrollStatus locally since it's not in the generated client yet
type PayrollStatus = 'DRAFT' | 'COMPUTED' | 'APPROVED' | 'RELEASED' | 'VOIDED';

const prisma = new PrismaClient();

/**
 * Creates comprehensive test data for payroll status flow testing
 * This creates a complete lifecycle for a single employee's payroll
 */
export async function seedPayrollTestFlow() {
  console.log('🧪 Seeding payroll test flow...');

  // Get test employee with compensation
  const employee = await prisma.employee.findFirst({
    include: {
      department: true,
      compensations: {
        where: { effectiveDate: { lte: new Date() } },
        orderBy: { effectiveDate: 'desc' },
        take: 1
      }
    },
    where: {
      compensations: {
        some: {
          effectiveDate: { lte: new Date() }
        }
      }
    }
  });

  if (!employee || !employee.compensations[0]) {
    console.log('⚠️  No employee with compensation found, skipping test flow');
    return;
  }

  // Get any test user
  const testUser = await prisma.user.findFirst();

  if (!testUser) {
    console.log('⚠️  No test user found, skipping test flow');
    return;
  }

  // Get existing payroll periods
  const payrollPeriods = await prisma.payrollPeriod.findMany({
    take: 5,
    orderBy: { startDate: 'desc' }
  });

  if (payrollPeriods.length < 4) {
    console.log('⚠️  Not enough payroll periods found, skipping test flow');
    return;
  }

  // Create payroll in DRAFT status
  const draftPayroll = await (prisma as any).payroll.create({
    data: {
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department!.organizationId,
      departmentId: employee.departmentId,
      periodStart: payrollPeriods[0].startDate,
      periodEnd: payrollPeriods[0].endDate,
      grossPay: 50000,
      netPay: 42000,
      taxableIncome: 50000,
      taxDeduction: 5000,
      philhealthDeduction: 1500,
      sssDeduction: 1000,
      pagibigDeduction: 500,
      totalDeductions: 8000,
      processedAt: new Date(),
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ Created DRAFT payroll: ${draftPayroll.id}`);

  // Log draft creation
  await (prisma as any).payrollLog.create({
    data: {
      id: generateULID(),
      payrollId: draftPayroll.id,
      action: 'GENERATED',
      previousStatus: null,
      newStatus: 'DRAFT',
      userId: testUser.id,
      timestamp: new Date()
    }
  });

  // Create payroll in COMPUTED status
  const computedPayroll = await (prisma as any).payroll.create({
    data: {
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department!.organizationId,
      departmentId: employee.departmentId,
      periodStart: payrollPeriods[1].startDate,
      periodEnd: payrollPeriods[1].endDate,
      grossPay: 50000,
      netPay: 42000,
      taxableIncome: 50000,
      taxDeduction: 5000,
      philhealthDeduction: 1500,
      sssDeduction: 1000,
      pagibigDeduction: 500,
      totalDeductions: 8000,
      processedAt: new Date(),
      status: 'COMPUTED',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ Created COMPUTED payroll: ${computedPayroll.id}`);

  // Create earnings and deductions for computed payroll
  await prisma.payrollEarning.createMany({
    data: [
      {
        id: generateULID(),
        payrollId: computedPayroll.id,
        organizationId: computedPayroll.organizationId,
        employeeId: employee.id,
        type: 'BASE_SALARY',
        hours: 160,
        rate: 312.5,
        amount: 50000
      },
      {
        id: generateULID(),
        payrollId: computedPayroll.id,
        organizationId: computedPayroll.organizationId,
        employeeId: employee.id,
        type: 'OVERTIME',
        hours: 10,
        rate: 390.63,
        amount: 3906.25
      }
    ]
  });

  await prisma.deduction.createMany({
    data: [
      {
        id: generateULID(),
        payrollId: computedPayroll.id,
        organizationId: computedPayroll.organizationId,
        employeeId: employee.id,
        type: 'TAX',
        amount: 5000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: generateULID(),
        payrollId: computedPayroll.id,
        organizationId: computedPayroll.organizationId,
        employeeId: employee.id,
        type: 'SSS',
        amount: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: generateULID(),
        payrollId: computedPayroll.id,
        organizationId: computedPayroll.organizationId,
        employeeId: employee.id,
        type: 'PHILHEALTH',
        amount: 1500,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: generateULID(),
        payrollId: computedPayroll.id,
        organizationId: computedPayroll.organizationId,
        employeeId: employee.id,
        type: 'PAGIBIG',
        amount: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  });

  // Log computation
  await (prisma as any).payrollLog.create({
    data: {
      id: generateULID(),
      payrollId: computedPayroll.id,
      action: 'GENERATED',
      previousStatus: null,
      newStatus: 'COMPUTED',
      userId: testUser.id,
      timestamp: new Date()
    }
  });

  // Create payroll in APPROVED status
  const approvedPayroll = await (prisma as any).payroll.create({
    data: {
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department!.organizationId,
      departmentId: employee.departmentId,
      periodStart: payrollPeriods[2].startDate,
      periodEnd: payrollPeriods[2].endDate,
      grossPay: 50000,
      netPay: 42000,
      taxableIncome: 50000,
      taxDeduction: 5000,
      philhealthDeduction: 1500,
      sssDeduction: 1000,
      pagibigDeduction: 500,
      totalDeductions: 8000,
      processedAt: new Date(),
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: testUser.id,
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      updatedAt: new Date()
    }
  });

  console.log(`✅ Created APPROVED payroll: ${approvedPayroll.id}`);

  // Log approval
  await (prisma as any).payrollLog.createMany({
    data: [
      {
        id: generateULID(),
        payrollId: approvedPayroll.id,
        action: 'GENERATED',
        previousStatus: null,
        newStatus: 'COMPUTED',
        userId: testUser.id,
        timestamp: new Date(Date.now() - 86400000)
      },
      {
        id: generateULID(),
        payrollId: approvedPayroll.id,
        action: 'APPROVED',
        previousStatus: 'COMPUTED',
        newStatus: 'APPROVED',
        userId: testUser.id,
        timestamp: new Date()
      }
    ]
  });

  // Create payroll in RELEASED status
  const releasedPayroll = await (prisma as any).payroll.create({
    data: {
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department!.organizationId,
      departmentId: employee.departmentId,
      periodStart: payrollPeriods[3].startDate,
      periodEnd: payrollPeriods[3].endDate,
      grossPay: 50000,
      netPay: 42000,
      taxableIncome: 50000,
      taxDeduction: 5000,
      philhealthDeduction: 1500,
      sssDeduction: 1000,
      pagibigDeduction: 500,
      totalDeductions: 8000,
      processedAt: new Date(),
      status: 'RELEASED',
      approvedAt: new Date(Date.now() - 172800000), // 2 days ago
      approvedBy: testUser.id,
      releasedAt: new Date(),
      releasedBy: testUser.id,
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date()
    }
  });

  console.log(`✅ Created RELEASED payroll: ${releasedPayroll.id}`);

  // Log release
  await (prisma as any).payrollLog.createMany({
    data: [
      {
        id: generateULID(),
        payrollId: releasedPayroll.id,
        action: 'GENERATED',
        previousStatus: null,
        newStatus: 'COMPUTED',
        userId: testUser.id,
        timestamp: new Date(Date.now() - 172800000)
      },
      {
        id: generateULID(),
        payrollId: releasedPayroll.id,
        action: 'APPROVED',
        previousStatus: 'COMPUTED',
        newStatus: 'APPROVED',
        userId: testUser.id,
        timestamp: new Date(Date.now() - 86400000)
      },
      {
        id: generateULID(),
        payrollId: releasedPayroll.id,
        action: 'RELEASED',
        previousStatus: 'APPROVED',
        newStatus: 'RELEASED',
        userId: testUser.id,
        timestamp: new Date()
      }
    ]
  });

  // Create payroll in VOIDED status
  const voidedPayroll = await (prisma as any).payroll.create({
    data: {
      id: generateULID(),
      employeeId: employee.id,
      organizationId: employee.department!.organizationId,
      departmentId: employee.departmentId,
      periodStart: payrollPeriods[4]?.startDate || payrollPeriods[0].startDate,
      periodEnd: payrollPeriods[4]?.endDate || payrollPeriods[0].endDate,
      grossPay: 50000,
      netPay: 42000,
      taxableIncome: 50000,
      taxDeduction: 5000,
      philhealthDeduction: 1500,
      sssDeduction: 1000,
      pagibigDeduction: 500,
      totalDeductions: 8000,
      processedAt: new Date(),
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: testUser.id,
      voidReason: 'Incorrect calculation - needs regeneration',
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      updatedAt: new Date()
    }
  });

  console.log(`✅ Created VOIDED payroll: ${voidedPayroll.id}`);

  // Log void
  await (prisma as any).payrollLog.createMany({
    data: [
      {
        id: generateULID(),
        payrollId: voidedPayroll.id,
        action: 'GENERATED',
        previousStatus: null,
        newStatus: 'COMPUTED',
        userId: testUser.id,
        timestamp: new Date(Date.now() - 259200000)
      },
      {
        id: generateULID(),
        payrollId: voidedPayroll.id,
        action: 'VOIDED',
        previousStatus: 'COMPUTED',
        newStatus: 'VOIDED',
        reason: 'Incorrect calculation - needs regeneration',
        userId: testUser.id,
        timestamp: new Date()
      }
    ]
  });

  console.log('✅ Payroll test flow seeding completed!');
  console.log('');
  console.log('Test payrolls created:');
  console.log(`- DRAFT: ${draftPayroll.id} (can be recalculated)`);
  console.log(`- COMPUTED: ${computedPayroll.id} (can be approved)`);
  console.log(`- APPROVED: ${approvedPayroll.id} (can be released)`);
  console.log(`- RELEASED: ${releasedPayroll.id} (can be voided)`);
  console.log(`- VOIDED: ${voidedPayroll.id} (excluded from queries)`);
}

// Run if called directly
if (require.main === module) {
  seedPayrollTestFlow()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
