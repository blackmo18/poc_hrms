import { employeeController } from '@/lib/controllers/employee.controller';
import { OvertimeController } from '@/lib/controllers/overtime.controller';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { holidayService } from '@/lib/service/holiday.service';
import { timeEntryService } from '@/lib/service/time-entry.service';

export interface PayrollSummaryRequest {
  organizationId: string;
  departmentId?: string;
  cutoffPeriod: {
    start: string;
    end: string;
  };
}

export interface PayrollSummaryResponse {
  organizationId: string;
  departmentId?: string;
  cutoffPeriod: {
    start: string;
    end: string;
  };
  employees: {
    total: number;
    eligible: number;
    ineligible: number;
    exclusionReasons: {
      missingSalaryConfig: number;
      missingAttendance: number;
    };
  };
  attendance: {
    totalRecords: number;
    expectedEmployees: number;
    employeesWithRecords: number;
    missingEmployeesCount: number;
    complete: boolean;
  };
  overtime: {
    totalRequests: number;
    approvedCount: number;
    pendingCount: number;
  };
  holidays: {
    affectedEmployeesCount: number;
  };
  readiness: {
    canGenerate: boolean;
    blockingIssues: string[];
    warnings: string[];
  };
  payrollStatus: {
    currentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    lastGeneratedAt?: string;
    hasExistingRun: boolean;
  };
}

export class PayrollSummaryService {
  async generateSummary(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PayrollSummaryResponse> {
    // Get total employees in organization/department
    const totalEmployees = await this.getEmployeeCount(organizationId, departmentId);

    // Get employee eligibility data
    const employeeEligibility = await this.getEmployeeEligibility(organizationId, departmentId);

    // Get attendance statistics
    const attendanceStats = await this.getAttendanceStats(organizationId, departmentId, periodStart, periodEnd);

    // Get overtime statistics
    const overtimeStats = await this.getOvertimeStats(organizationId, departmentId, periodStart, periodEnd);

    // Get holiday impacts
    const holidayStats = await this.getHolidayStats(organizationId, departmentId, periodStart, periodEnd);

    // Get payroll status
    const payrollStatus = await this.getPayrollStatus(organizationId, departmentId, periodStart, periodEnd);

    // Determine readiness
    const readiness = this.calculateReadiness(employeeEligibility, attendanceStats, payrollStatus);

    return {
      organizationId,
      departmentId,
      cutoffPeriod: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
      employees: {
        total: totalEmployees,
        eligible: employeeEligibility.eligible,
        ineligible: employeeEligibility.ineligible,
        exclusionReasons: employeeEligibility.exclusionReasons,
      },
      attendance: attendanceStats,
      overtime: overtimeStats,
      holidays: holidayStats,
      readiness,
      payrollStatus,
    };
  }

  private async getEmployeeCount(organizationId: string, departmentId?: string): Promise<number> {
    const result = await employeeController.getAll(organizationId, departmentId, { page: 1, limit: 1 });
    return result.pagination.total;
  }

  private async getEmployeeEligibility(organizationId: string, departmentId?: string) {
    // Get all employees using the controller
    const result = await employeeController.getAll(organizationId, departmentId, { page: 1, limit: 1000 }); // Get all for eligibility check
    const employees = result.data;

    let missingSalaryConfig = 0;

    for (const employee of employees) {
      // Check for salary configuration by looking at compensations array
      // Employees without compensations are considered to have missing salary config
      if (!employee.compensations || employee.compensations.length === 0) {
        missingSalaryConfig++;
      }
    }

    const eligible = employees.length - missingSalaryConfig;
    const ineligible = missingSalaryConfig;

    return {
      eligible,
      ineligible,
      exclusionReasons: {
        missingSalaryConfig,
        missingAttendance: 0, // Will be calculated in attendance check
      },
    };
  }

  private async getAttendanceStats(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get expected employees
    const expectedEmployees = await this.getEmployeeCount(organizationId, departmentId);

    // Get time entries for the period using the time entry service
    // Note: We need to add a method to timeEntryService for getting entries by organization/department and date range
    // For now, we'll create a simplified version
    const timeEntries = await timeEntryService.getTimeEntriesByOrganizationAndPeriod(
      organizationId,
      departmentId,
      periodStart,
      periodEnd
    );

    // Count unique employees with time entries
    const employeesWithRecords = new Set(timeEntries.map(te => te.employeeId)).size;
    const missingEmployeesCount = Math.max(0, expectedEmployees - employeesWithRecords);

    return {
      totalRecords: timeEntries.length,
      expectedEmployees,
      employeesWithRecords,
      missingEmployeesCount,
      complete: missingEmployeesCount === 0,
    };
  }

  private async getOvertimeStats(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get overtime requests using the overtime controller
    const overtimeRequests = await OvertimeController.getOvertimeRequestsByOrganizationAndPeriod(
      organizationId,
      departmentId,
      periodStart,
      periodEnd
    );

    const approvedCount = overtimeRequests.filter(req => req.status === 'APPROVED').length;
    const pendingCount = overtimeRequests.filter(req => req.status === 'PENDING').length;

    return {
      totalRequests: overtimeRequests.length,
      approvedCount,
      pendingCount,
    };
  }

  private async getHolidayStats(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get holidays for the organization and period using holiday service
    const holidays = await holidayService.getHolidays(organizationId, periodStart, periodEnd);

    // Count employees affected by holidays
    // This is a simplified count - in reality, you'd check which employees
    // have time entries on holiday dates
    const affectedEmployeesCount = holidays.length > 0
      ? await this.getEmployeeCount(organizationId, departmentId)
      : 0;

    return {
      affectedEmployeesCount,
    };
  }

  private async getPayrollStatus(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Check if payroll already exists for this period using payroll controller
    // Note: We need to add a method to payrollController for checking existing payrolls by period
    const existingPayrolls = await payrollController.getPayrollsByOrganizationAndPeriod(
      organizationId,
      departmentId,
      periodStart,
      periodEnd
    );

    const hasExistingRun = existingPayrolls.length > 0;
    const lastGeneratedPayroll = existingPayrolls[0]; // Already sorted by processedAt desc

    return {
      currentStatus: 'PENDING' as const,
      lastGeneratedAt: lastGeneratedPayroll?.processedAt?.toISOString(),
      hasExistingRun,
    };
  }

  private calculateReadiness(
    employeeEligibility: any,
    attendanceStats: any,
    payrollStatus: any
  ) {
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // Check for blocking issues
    if (employeeEligibility.eligible === 0) {
      blockingIssues.push('No eligible employees found for payroll generation');
    }

    if (!attendanceStats.complete) {
      warnings.push(`${attendanceStats.missingEmployeesCount} employees missing attendance records`);
    }

    if (payrollStatus.hasExistingRun) {
      warnings.push('Payroll has already been generated for this period');
    }

    // Add holiday warning if applicable
    // This would be more sophisticated in a real implementation

    const canGenerate = blockingIssues.length === 0;

    return {
      canGenerate,
      blockingIssues,
      warnings,
    };
  }
}

export const payrollSummaryService = new PayrollSummaryService();
