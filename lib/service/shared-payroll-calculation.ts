import { PayrollCalculationService, PayrollCalculationResult as ServicePayrollCalculationResult, DailyPayResult } from './payroll-calculation.service';
import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { PayrollLogService } from './payroll-log.service';
import {
  PayrollCalculationInput,
  PayrollCalculationOutput,
  Employee,
  Compensation,
  Organization,
  PayrollRecord,
  PayrollEarning,
  Deduction,
  EmployeePayrollData,
  PayrollLogData,
  PayrollCalculationResult as TypePayrollCalculationResult,
  DeductionType
} from '../types/payroll.types';

import { DIContainer } from '../di/container';
import { logInfo } from '../utils/logger';
import { formatDateToYYYYMMDD } from '../utils/date-utils';

function getDIContainer() {
  return DIContainer.getInstance();
}

let payrollCalculationService: PayrollCalculationService;
function getPayrollCalculationService(): PayrollCalculationService {
  if (!payrollCalculationService) {
    payrollCalculationService = getDIContainer().getPayrollCalculationService();
  }
  return payrollCalculationService;
}


/**
 * Shared payroll calculation logic that can be used for both preview and actual payroll generation
 */
export class SharedPayrollCalculation {
  private get payrollCalculationService(): PayrollCalculationService {
    return getPayrollCalculationService();
  }

  /**
   * Calculate payroll for an employee
   * Can be used for preview (persistData=false) or actual generation (persistData=true)
   */
  async calculatePayroll(input: PayrollCalculationInput): Promise<PayrollCalculationOutput> {
    const { employeeId, organizationId, departmentId, periodStart, periodEnd, options = {} } = input;
    const { persistData = false, userId, status = 'COMPUTED' } = options;

    // Get employee data with compensation
    const employee: Employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        jobTitle: true,
        compensations: {
          where: {
            effectiveDate: { lte: new Date() }
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1
        },
        organization: true
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const currentCompensation: Compensation = employee.compensations[0];
    if (!currentCompensation) {
      throw new Error('No compensation record found for employee');
    }

    // Get organization details
    const organization: Organization = employee.organization || await prisma.organization.findUnique({
      where: { id: employee.organizationId || organizationId },
    });

    // Perform calculation
    const calculationResult: ServicePayrollCalculationResult = await this.payrollCalculationService.calculateCompletePayroll(
      organizationId,
      employeeId,
      periodStart,
      periodEnd,
      currentCompensation.baseSalary
    );

    let payrollRecord: PayrollRecord | null = null;
    let earnings: PayrollEarning[] = [];
    let deductions: Deduction[] = [];

    // Persist data if requested
    if (persistData) {
      // Create payroll record
      payrollRecord = await prisma.payroll.create({
        data: {
          id: generateULID(),
          employeeId: employeeId,
          organizationId: organizationId,
          departmentId: departmentId,
          periodStart: periodStart,
          periodEnd: periodEnd,
          grossPay: calculationResult.total_gross_pay,
          netPay: calculationResult.total_net_pay,
          taxableIncome: calculationResult.taxable_income,
          taxDeduction: calculationResult.government_deductions.tax,
          philhealthDeduction: calculationResult.government_deductions.philhealth,
          sssDeduction: calculationResult.government_deductions.sss,
          pagibigDeduction: calculationResult.government_deductions.pagibig,
          totalDeductions: calculationResult.total_deductions,
          processedAt: new Date(),
          status: status,
        } as any,
      });

      // Create deduction records
      const allDeductions = [
        { type: 'TAX' as DeductionType, amount: calculationResult.government_deductions.tax },
        { type: 'PHILHEALTH' as DeductionType, amount: calculationResult.government_deductions.philhealth },
        { type: 'SSS' as DeductionType, amount: calculationResult.government_deductions.sss },
        { type: 'PAGIBIG' as DeductionType, amount: calculationResult.government_deductions.pagibig },
        { type: 'LATE' as DeductionType, amount: calculationResult.policy_deductions.late },
        { type: 'ABSENCE' as DeductionType, amount: calculationResult.policy_deductions.absence },
      ].filter(d => d.amount > 0);

      if (allDeductions.length > 0) {
        await prisma.deduction.createMany({
          data: allDeductions.map(deduction => ({
            id: generateULID(),
            payrollId: payrollRecord.id,
            employeeId,
            organizationId,
            type: deduction.type,
            amount: deduction.amount,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
        // Store the actual deduction records for return
        deductions = await prisma.deduction.findMany({
          where: { payrollId: payrollRecord.id }
        }) as Deduction[];
      }

      // Create earning records
      const earningRecords = [];
      
      if (calculationResult.total_regular_pay > 0) {
        earningRecords.push({
          id: generateULID(),
          payrollId: payrollRecord.id,
          organizationId,
          employeeId,
          type: 'BASE_SALARY',
          hours: calculationResult.total_regular_minutes / 60,
          rate: currentCompensation.baseSalary / 160,
          amount: calculationResult.total_regular_pay,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (calculationResult.total_overtime_pay > 0) {
        earningRecords.push({
          id: generateULID(),
          payrollId: payrollRecord.id,
          organizationId,
          employeeId,
          type: 'OVERTIME',
          hours: calculationResult.total_overtime_minutes / 60,
          rate: (currentCompensation.baseSalary / 160) * 1.25,
          amount: calculationResult.total_overtime_pay,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (calculationResult.total_night_diff_pay > 0) {
        earningRecords.push({
          id: generateULID(),
          payrollId: payrollRecord.id,
          organizationId,
          employeeId,
          type: 'NIGHT_DIFFERENTIAL',
          hours: calculationResult.total_night_diff_minutes / 60,
          rate: (currentCompensation.baseSalary / 160) * 0.10,
          amount: calculationResult.total_night_diff_pay,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (earningRecords.length > 0) {
        await prisma.payrollEarning.createMany({
          data: earningRecords,
        });
        // Store the actual earning records for return
        earnings = await prisma.payrollEarning.findMany({
          where: { payrollId: payrollRecord.id }
        }) as PayrollEarning[];
      }

      // Log the action if userId provided
      if (userId) {
        const payrollLogService = PayrollLogService.getInstance();
        const logData: PayrollLogData = {
          payrollId: payrollRecord.id,
          action: 'GENERATED',
          previousStatus: 'DRAFT',
          newStatus: status,
          userId,
        };
        await payrollLogService.logAction(logData);
      }
    }

    return {
      calculationResult: calculationResult as unknown as TypePayrollCalculationResult,
      employeeData: employee,
      compensation: currentCompensation,
      organization,
      payrollRecord,
      earnings,
      deductions,
    };
  }

  /**
   * Transform calculation result to EmployeePayrollData format
   * This maintains compatibility with existing UI components
   */
  async transformToEmployeePayrollData(
    output: PayrollCalculationOutput,
    periodStart: Date,
    periodEnd: Date
  ): Promise<EmployeePayrollData> {
    const { calculationResult, employeeData, compensation, organization, payrollRecord } = output;

    // Calculate actual absent days
    const actualAbsentDays = await this.payrollCalculationService.calculateActualAbsentDays(
      employeeData.id,
      periodStart,
      periodEnd
    );
    
    // Use attendance data from calculation result (which is more accurate)
    const presentDays = calculationResult.daily_breakdown.filter(d => d.regular_minutes > 0).length;
    const lateDays = calculationResult.daily_breakdown.filter(d => d.late_minutes > 0).length;
    const totalLateMinutes = calculationResult.daily_breakdown.reduce((sum, d) => sum + d.late_minutes, 0);
    
    // For absent days, use the calculated value but ensure consistency
    // The calculation result already has the correct absent days
    const consistentAbsentDays = actualAbsentDays;

    const data =  {
      id: payrollRecord?.id || null,
      employeeId: employeeData.employeeId || employeeData.id,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      departmentName: employeeData.department?.name,
      position: employeeData.jobTitle?.name,
      baseSalary: compensation.baseSalary,
      company: {
        id: organization?.id || employeeData.organizationId,
        name: organization?.name || 'Unknown Company',
        email: organization?.email || undefined,
        contactNumber: organization?.contactNumber || undefined,
        address: organization?.address || undefined,
        logo: organization?.logo || undefined,
        website: organization?.website || undefined,
      },
      attendance: {
        presentDays: presentDays,
        absentDays: consistentAbsentDays,
        lateDays: lateDays,
        overtimeHours: Math.floor(calculationResult.total_overtime_minutes / 60),
        lateMinutes: totalLateMinutes,
        undertimeMinutes: calculationResult.daily_breakdown.reduce((sum, d) => sum + d.undertime_minutes, 0),
      },
      earnings: {
        basicSalary: calculationResult.total_regular_pay,
        overtimePay: calculationResult.total_overtime_pay,
        holidayPay: 0, // TODO: Calculate from daily breakdown
        nightDifferential: calculationResult.total_night_diff_pay,
        totalEarnings: calculationResult.total_gross_pay,
        regularHours: Math.floor(calculationResult.total_regular_minutes / 60),
        overtimeHours: Math.floor(calculationResult.total_overtime_minutes / 60),
        nightDiffHours: Math.floor(calculationResult.total_night_diff_minutes / 60),
      },
      deductions: {
        sss: calculationResult.government_deductions.sss,
        philhealth: calculationResult.government_deductions.philhealth,
        pagibig: calculationResult.government_deductions.pagibig,
        withholdingTax: calculationResult.government_deductions.tax,
        lateDeduction: calculationResult.policy_deductions.late,
        absenceDeduction: calculationResult.policy_deductions.absence,
        totalDeductions: calculationResult.total_deductions,
        governmentDeductions: calculationResult.government_deductions.total,
        policyDeductions: calculationResult.policy_deductions.total,
      },
      netPay: calculationResult.total_net_pay,
      cutoffPeriod: {
        start: formatDateToYYYYMMDD(periodStart),
        end: formatDateToYYYYMMDD(periodEnd)
      },
      organization: {
        id: organization?.id || employeeData.organizationId,
        name: organization?.name || 'Unknown',
      },
      status: payrollRecord?.status || 'PENDING',
      processedAt: payrollRecord?.processedAt?.toISOString(),
      processedBy: payrollRecord?.processedBy,
    };
    logInfo('PAYROLL_CALCULATION_TRANSFORMED_DATA', data)
    return data
  }
}

// Export singleton instance
export const sharedPayrollCalculation = new SharedPayrollCalculation();
