import { PayrollStatus } from '@prisma/client';

// Base types for payroll entities
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string; // Added organizationId field
  department?: {
    id: string;
    name: string;
  };
  jobTitle?: {
    id: string;
    name: string;
  };
  organization?: Organization;
  compensations?: Compensation[];
}

export interface Compensation {
  id: string;
  baseSalary: number;
  effectiveDate: Date;
}

export interface Organization {
  id: string;
  name: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  logo?: string;
  website?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  organizationId: string;
  departmentId?: string;
  periodStart: Date;
  periodEnd: Date;
  grossPay: number;
  netPay: number;
  taxableIncome?: number;
  taxDeduction?: number;
  philhealthDeduction?: number;
  sssDeduction?: number;
  pagibigDeduction?: number;
  totalDeductions?: number;
  processedAt?: Date;
  processedBy?: string; // Added processedBy field
  status: PayrollStatus;
  approvedAt?: Date;
  approvedBy?: string;
  releasedAt?: Date;
  releasedBy?: string;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  employee?: Employee;
  organization?: Organization;
  deductions?: Deduction[];
  earnings?: PayrollEarning[];
}

export interface Deduction {
  id: string;
  payrollId: string;
  employeeId: string;
  organizationId: string;
  type: DeductionType;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DeductionType = 'TAX' | 'PHILHEALTH' | 'SSS' | 'PAGIBIG' | 'LATE' | 'ABSENCE';

export interface PayrollEarning {
  id: string;
  payrollId: string;
  organizationId: string;
  employeeId: string;
  type: EarningType;
  hours: number;
  rate: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EarningType = 'BASE_SALARY' | 'OVERTIME' | 'NIGHT_DIFFERENTIAL' | 'HOLIDAY_PAY';

// Input types for API
export interface PayrollGenerationInput {
  employeeId: string;
  organizationId: string;
  departmentId?: string;
  periodStart: Date;
  periodEnd: Date;
  userId?: string;
}

// Output types for calculations
// Update the types file to match the actual PayrollCalculationResult from the service
export interface PayrollCalculationResult {
  employeeId: string;
  period_start: Date;
  period_end: Date;
  total_regular_minutes: number;
  total_overtime_minutes: number;
  total_night_diff_minutes: number;
  total_regular_pay: number;
  total_overtime_pay: number;
  total_night_diff_pay: number;
  total_gross_pay: number;
  taxable_income: number;
  government_deductions: {
    tax: number;
    philhealth: number;
    sss: number;
    pagibig: number;
    total: number;
  };
  policy_deductions: {
    late: number;
    absence: number;
    total: number;
  };
  total_deductions: number;
  total_net_pay: number;
  daily_breakdown: DailyPayResult[];
}

export interface DailyPayResult {
  date: Date;
  day_type: any; // DayType from Prisma
  holiday_type: any; // HolidayType from Prisma
  regular_minutes: number;
  overtime_minutes: number;
  night_diff_minutes: number;
  late_minutes: number;
  undertime_minutes: number;
  regular_pay: number;
  overtime_pay: number;
  night_diff_pay: number;
  late_deduction: number;
  absence_deduction: number;
  gross_pay: number;
  net_pay: number;
}

// Service layer types
export interface PayrollCalculationOptions {
  persistData?: boolean;
  userId?: string;
  status?: PayrollStatus;
}

export interface PayrollCalculationInput {
  employeeId: string;
  organizationId: string;
  departmentId?: string;
  periodStart: Date;
  periodEnd: Date;
  options?: PayrollCalculationOptions;
}

export interface PayrollCalculationOutput {
  calculationResult: PayrollCalculationResult;
  employeeData: Employee;
  compensation: Compensation;
  organization: Organization;
  payrollRecord?: PayrollRecord;
  earnings?: PayrollEarning[];
  deductions?: Deduction[];
}

// Employee Payroll Data (for UI compatibility)
export interface EmployeePayrollData {
  id: string | null;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  position?: string;
  baseSalary: number;
  company: {
    id: string;
    name: string;
    email?: string;
    contactNumber?: string;
    address?: string;
    logo?: string;
    website?: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
    lateMinutes: number;
    undertimeMinutes: number;
  };
  earnings: {
    basicSalary: number;
    overtimePay: number;
    holidayPay: number;
    nightDifferential: number;
    totalEarnings: number;
    regularHours: number;
    overtimeHours: number;
    nightDiffHours: number;
  };
  deductions: {
    sss: number;
    philhealth: number;
    pagibig: number;
    withholdingTax: number;
    lateDeduction: number;
    absenceDeduction: number;
    totalDeductions: number;
    governmentDeductions: number;
    policyDeductions: number;
  };
  netPay: number;
  cutoffPeriod: {
    start: string;
    end: string;
  };
  organization: {
    id: string;
    name: string;
  };
  status: string;
  processedAt?: string;
  processedBy?: string;
}

// Payroll Log types
export interface PayrollLogData {
  payrollId: string;
  action: PayrollLogAction;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  userId: string;
}

export type PayrollLogAction = 'GENERATED' | 'APPROVED' | 'RELEASED' | 'VOIDED' | 'RECALCULATED';

export interface PayrollLogEntry {
  id: string;
  payrollId: string;
  action: PayrollLogAction;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  userId: string;
  timestamp: Date;
  user: {
    id: string;
    email: string;
    name: string;
  };
  payroll?: {
    id: string;
    employee: string;
    employeeId: string;
    period: {
      start: Date;
      end: Date;
    };
  };
}

// API Response types
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
  };
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PayrollValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}
