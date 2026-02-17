import { employeeController } from '@/lib/controllers/employee.controller';
import { OvertimeController } from '@/lib/controllers/overtime.controller';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { holidayService } from '@/lib/service/holiday.service';
import { timeEntryService } from '@/lib/service/time-entry.service';
import { getServiceContainer } from '@/lib/di/container';
import { getWorkScheduleService } from '@/lib/service/work-schedule.service';
import { getLateDeductionPolicyService } from '@/lib/service/late-deduction-policy.service';
import { prisma } from '@/lib/db';

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
      missingWorkSchedule: number;
    };
    eligibleEmployees?: Array<{
      id: string;
      employeeId: string;
      firstName: string;
      lastName: string;
      departmentName?: string;
      baseSalary: number;
      hasAttendance: boolean;
      hasWorkSchedule: boolean;
      lateMinutes: number;
      absenceCount: number;
    }>;
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
  deductions: {
    totals: {
      tax: number;
      philhealth: number;
      sss: number;
      pagibig: number;
      late: number;
      absence: number;
      total: number;
    };
    breakdown: {
      government: number;
      policy: number;
    };
  };
  metrics: {
    lateness: {
      totalLateInstances: number;
      totalLateMinutes: number;
      affectedEmployees: number;
    };
    absence: {
      totalAbsences: number;
      affectedEmployees: number;
    };
    undertime: {
      totalUndertimeMinutes: number;
      affectedEmployees: number;
    };
  };
}

export class PayrollSummaryService {
  private phDeductionsService = getServiceContainer().getPHDeductionsService();
  private workScheduleService = getWorkScheduleService();
  private lateDeductionPolicyService = getLateDeductionPolicyService();

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

    // Update eligible employees with attendance and work schedule status
    if (employeeEligibility.eligibleEmployees) {
      const employeesWithAttendance = new Set(
        (await timeEntryService.getTimeEntriesByOrganizationAndPeriod(
          organizationId,
          departmentId,
          periodStart,
          periodEnd
        )).map(te => te.employeeId)
      );

      // Check work schedules
      const employeesWithSchedule = new Set<string>();
      const latenessData = new Map<string, { minutes: number; instances: number }>();
      const absenceData = new Map<string, number>();

      for (const emp of employeeEligibility.eligibleEmployees) {
        // Check work schedule
        try {
          const schedule = await this.workScheduleService.getByEmployeeId(emp.id);
          if (schedule) {
            employeesWithSchedule.add(emp.id);
            
            // Calculate lateness and absences
            const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
              emp.id,
              periodStart,
              periodEnd
            );

            let totalLateMinutes = 0;
            let lateInstances = 0;

            for (const entry of timeEntries) {
              if (!entry.clockOutAt) continue;

              const validation = await this.workScheduleService.validateTimeEntry(
                schedule,
                entry.clockInAt,
                entry.clockOutAt
              );

              if (validation.lateMinutes > 0) {
                totalLateMinutes += validation.lateMinutes;
                lateInstances++;
              }
            }

            if (totalLateMinutes > 0) {
              latenessData.set(emp.id, { minutes: totalLateMinutes, instances: lateInstances });
            }

            // Calculate absences
            const expectedWorkDays = await this.workScheduleService.getWorkDaysForPeriod(
              schedule,
              periodStart,
              periodEnd
            );

            const datesWithEntries = new Set(
              timeEntries.map(entry => entry.workDate.toISOString().split('T')[0])
            );

            let absenceCount = 0;
            for (const workDay of expectedWorkDays) {
              const dateStr = workDay.toISOString().split('T')[0];
              if (!datesWithEntries.has(dateStr)) {
                absenceCount++;
              }
            }

            if (absenceCount > 0) {
              absenceData.set(emp.id, absenceCount);
            }
          }
        } catch (error) {
          // Employee doesn't have work schedule
        }
      }

      employeeEligibility.eligibleEmployees.forEach(emp => {
        emp.hasAttendance = employeesWithAttendance.has(emp.id);
        emp.hasWorkSchedule = employeesWithSchedule.has(emp.id);
        emp.lateMinutes = latenessData.get(emp.id)?.minutes || 0;
        emp.absenceCount = absenceData.get(emp.id) || 0;
      });
    }

    // Get overtime statistics
    const overtimeStats = await this.getOvertimeStats(organizationId, departmentId, periodStart, periodEnd);

    // Get holiday impacts
    const holidayStats = await this.getHolidayStats(organizationId, departmentId, periodStart, periodEnd);

    // Get payroll status
    const payrollStatus = await this.getPayrollStatus(organizationId, departmentId, periodStart, periodEnd);

    // Calculate deduction totals with breakdown
    const deductions = await this.calculateDeductionTotals(organizationId, departmentId, periodStart, periodEnd);

    // Calculate lateness and absence metrics
    const metrics = await this.calculatePayrollMetrics(organizationId, departmentId, periodStart, periodEnd);

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
        eligibleEmployees: employeeEligibility.eligibleEmployees,
        exclusionReasons: {
          ...employeeEligibility.exclusionReasons,
          missingAttendance: attendanceStats.missingEmployeesCount,
          missingWorkSchedule: employeeEligibility.exclusionReasons.missingWorkSchedule || 0,
        },
      },
      attendance: attendanceStats,
      overtime: overtimeStats,
      holidays: holidayStats,
      readiness,
      payrollStatus,
      deductions,
      metrics,
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
    let missingWorkSchedule = 0;
    const eligibleEmployees: Array<{
      id: string;
      employeeId: string;
      firstName: string;
      lastName: string;
      departmentName?: string;
      baseSalary: number;
      hasAttendance: boolean;
      hasWorkSchedule: boolean;
      lateMinutes: number;
      absenceCount: number;
    }> = [];

    for (const employee of employees) {
      // Check for salary configuration by looking at compensations array
      // Employees without compensations are considered to have missing salary config
      if (!employee.compensations || employee.compensations.length === 0) {
        missingSalaryConfig++;
      } else {
        // Get current compensation
        const currentComp = employee.compensations.find(c => 
          new Date(c.effectiveDate) <= new Date()
        );

        // Check if employee has work schedule
        let hasSchedule = false;
        try {
          const schedule = await this.workScheduleService.getByEmployeeId(employee.id);
          hasSchedule = !!schedule;
        } catch (error) {
          // No work schedule found
        }

        if (!hasSchedule) {
          missingWorkSchedule++;
        }

        eligibleEmployees.push({
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          departmentName: employee.department?.name,
          baseSalary: currentComp?.baseSalary || 0,
          hasAttendance: true, // Will be updated in attendance check
          hasWorkSchedule: hasSchedule,
          lateMinutes: 0, // Will be calculated later
          absenceCount: 0, // Will be calculated later
        });
      }
    }

    const eligible = eligibleEmployees.length;
    const ineligible = missingSalaryConfig + missingWorkSchedule;

    return {
      eligible,
      ineligible,
      eligibleEmployees,
      exclusionReasons: {
        missingSalaryConfig,
        missingAttendance: 0, // Will be calculated in attendance check
        missingWorkSchedule,
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

  private async calculateDeductionTotals(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get all eligible employees with compensations
    const result = await employeeController.getAll(organizationId, departmentId, { page: 1, limit: 1000 });
    const employees = result.data;

    let totalTax = 0;
    let totalPhilhealth = 0;
    let totalSSS = 0;
    let totalPagibig = 0;
    let totalLate = 0;
    let totalAbsence = 0;

    // Calculate deductions for each employee
    for (const employee of employees) {
      if (employee.compensations && employee.compensations.length > 0) {
        // Get current compensation
        const currentComp = employee.compensations.find(c => 
          new Date(c.effectiveDate) <= periodEnd
        );

        if (currentComp) {
          // Calculate monthly gross (simplified - should include proration)
          const monthlyGross = currentComp.baseSalary;
          
          // Get work schedule for rate calculations
          let dailyRate = monthlyGross / 22; // Default
          let hourlyRate = dailyRate / 8;
          
          try {
            const schedule = await this.workScheduleService.getByEmployeeId(employee.id);
            if (schedule) {
              dailyRate = await this.workScheduleService.calculateDailyRate(schedule, monthlyGross);
              hourlyRate = await this.workScheduleService.calculateHourlyRate(schedule, monthlyGross);
            }
          } catch (error) {
            // No schedule, use defaults
          }
          
          // Calculate PH deductions
          const deductions = await this.phDeductionsService.calculateAllDeductions(
            organizationId,
            monthlyGross
          );

          totalTax += deductions.tax;
          totalPhilhealth += deductions.philhealth;
          totalSSS += deductions.sss;
          totalPagibig += deductions.pagibig;
          
          // Calculate policy deductions
          // Note: Using LATE policy type as TARDINESS is not in the enum
          const lateDeductions = await this.lateDeductionPolicyService.calculateDeduction(
            organizationId,
            'LATE',
            0, // Will be calculated based on actual time entries
            dailyRate,
            hourlyRate
          );
          
          // For actual calculation, we would need to process time entries
          // This is a simplified version
          const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
            employee.id,
            periodStart,
            periodEnd
          );
          
          let employeeLateTotal = 0;
          let employeeAbsenceTotal = 0;
          
          for (const entry of timeEntries) {
            if (!entry.clockOutAt) continue;
            
            try {
              const schedule = await this.workScheduleService.getByEmployeeId(employee.id);
              if (schedule) {
                const validation = await this.workScheduleService.validateTimeEntry(
                  schedule,
                  entry.clockInAt,
                  entry.clockOutAt
                );
                
                if (validation.lateMinutes > 0) {
                  const deduction = await this.lateDeductionPolicyService.calculateDeduction(
                    organizationId,
                    'LATE',
                    validation.lateMinutes,
                    dailyRate,
                    hourlyRate,
                    entry.workDate
                  );
                  employeeLateTotal += deduction;
                }
              }
            } catch (error) {
              // No schedule, skip
            }
          }
          
          // Calculate absences
          try {
            const schedule = await this.workScheduleService.getByEmployeeId(employee.id);
            if (schedule) {
              const expectedWorkDays = await this.workScheduleService.getWorkDaysForPeriod(
                schedule,
                periodStart,
                periodEnd
              );
              
              const datesWithEntries = new Set(
                timeEntries.map(entry => entry.workDate.toISOString().split('T')[0])
              );
              
              for (const workDay of expectedWorkDays) {
                const dateStr = workDay.toISOString().split('T')[0];
                if (!datesWithEntries.has(dateStr)) {
                  employeeAbsenceTotal += dailyRate;
                }
              }
            }
          } catch (error) {
            // No schedule, skip
          }
          
          totalLate += employeeLateTotal;
          totalAbsence += employeeAbsenceTotal;
        }
      }
    }

    const governmentTotal = totalTax + totalPhilhealth + totalSSS + totalPagibig;
    const policyTotal = totalLate + totalAbsence;

    return {
      totals: {
        tax: totalTax,
        philhealth: totalPhilhealth,
        sss: totalSSS,
        pagibig: totalPagibig,
        late: totalLate,
        absence: totalAbsence,
        total: governmentTotal + policyTotal,
      },
      breakdown: {
        government: governmentTotal,
        policy: policyTotal,
      },
    };
  }

  private async calculatePayrollMetrics(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    const result = await employeeController.getAll(organizationId, departmentId, { page: 1, limit: 1000 });
    const employees = result.data;

    let totalLateInstances = 0;
    let totalLateMinutes = 0;
    let lateAffectedEmployees = 0;
    
    let totalAbsences = 0;
    let absenceAffectedEmployees = 0;
    
    let totalUndertimeMinutes = 0;
    let undertimeAffectedEmployees = 0;

    for (const employee of employees) {
      let employeeLateMinutes = 0;
      let employeeLateInstances = 0;
      let employeeAbsences = 0;
      let employeeUndertimeMinutes = 0;
      
      try {
        const schedule = await this.workScheduleService.getByEmployeeId(employee.id);
        if (!schedule) continue;
        
        const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
          employee.id,
          periodStart,
          periodEnd
        );
        
        // Get expected work days for absence calculation
        const expectedWorkDays = await this.workScheduleService.getWorkDaysForPeriod(
          schedule,
          periodStart,
          periodEnd
        );
        
        const datesWithEntries = new Set(
          timeEntries.map(entry => entry.workDate.toISOString().split('T')[0])
        );
        
        // Check absences
        for (const workDay of expectedWorkDays) {
          const dateStr = workDay.toISOString().split('T')[0];
          if (!datesWithEntries.has(dateStr)) {
            employeeAbsences++;
          }
        }
        
        // Process time entries for lateness and undertime
        for (const entry of timeEntries) {
          if (!entry.clockOutAt) continue;
          
          const validation = await this.workScheduleService.validateTimeEntry(
            schedule,
            entry.clockInAt,
            entry.clockOutAt
          );
          
          if (validation.lateMinutes > 0) {
            employeeLateMinutes += validation.lateMinutes;
            employeeLateInstances++;
          }
          
          if (validation.undertimeMinutes > 0) {
            employeeUndertimeMinutes += validation.undertimeMinutes;
          }
        }
      } catch (error) {
        // No schedule, skip
      }
      
      // Update totals if employee has any issues
      if (employeeLateInstances > 0) {
        totalLateInstances += employeeLateInstances;
        totalLateMinutes += employeeLateMinutes;
        lateAffectedEmployees++;
      }
      
      if (employeeAbsences > 0) {
        totalAbsences += employeeAbsences;
        absenceAffectedEmployees++;
      }
      
      if (employeeUndertimeMinutes > 0) {
        totalUndertimeMinutes += employeeUndertimeMinutes;
        undertimeAffectedEmployees++;
      }
    }

    return {
      lateness: {
        totalLateInstances,
        totalLateMinutes,
        affectedEmployees: lateAffectedEmployees,
      },
      absence: {
        totalAbsences,
        affectedEmployees: absenceAffectedEmployees,
      },
      undertime: {
        totalUndertimeMinutes,
        affectedEmployees: undertimeAffectedEmployees,
      },
    };
  }
}

export const payrollSummaryService = new PayrollSummaryService();

