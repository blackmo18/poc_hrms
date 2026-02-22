import { PrismaClient } from '@prisma/client';
import { ITaxBracketPrismaController } from '../controllers/prisma/tax-bracket.prisma.controller';

export interface TaxCalculationDetails {
  monthlyTaxableIncome: number;
  annualTaxableIncome: number;
  taxBracket: {
    minSalary: number;
    maxSalary: number | null;
    baseTax: number;
    rate: number;
  };
  annualBaseTax: number;
  excessOverMin: number;
  taxOnExcess: number;
  annualTax: number;
  monthlyTax: number;
  isMinimumWage: boolean;
}

export interface TaxExemption {
  type: 'MINIMUM_WAGE' | 'PERSONAL_EXEMPTION' | 'DEPENDENT_EXEMPTION';
  amount: number;
  description: string;
}

export interface TaxSummary {
  organizationId: string;
  year: number;
  totalWithholdingTax: number;
  totalTaxableIncome: number;
  averageTaxRate: number;
  employeeCount: number;
  taxBrackets: any[];
}

/**
 * Tax Computation Service - Refactored to use Prisma Controller
 * Handles detailed tax calculations for Philippine payroll
 */
export class TaxComputationService {
  constructor(
    private taxBracketController: ITaxBracketPrismaController,
    private minimumWage: number = 16000 // Default minimum wage for NCR
  ) {}

  /**
   * Compute withholding tax with detailed breakdown
   */
  async computeWithholdingTax(
    organizationId: string,
    grossSalary: number,
    governmentDeductions: number,
    date: Date = new Date()
  ): Promise<TaxCalculationDetails> {
    // Calculate taxable income
    const monthlyTaxableIncome = Math.max(0, grossSalary - governmentDeductions);
    const annualTaxableIncome = monthlyTaxableIncome * 12;

    // Get applicable tax bracket
    const taxBracket = await this.taxBracketController.findApplicableBracket(
      organizationId,
      monthlyTaxableIncome,
      date
    );

    if (!taxBracket) {
      throw new Error('No tax bracket found for the given income');
    }

    // Calculate annual base tax
    const annualBaseTax = taxBracket.baseTax * 12;

    // Calculate excess over minimum salary
    const excessOverMin = Math.max(0, annualTaxableIncome - (taxBracket.minSalary * 12));

    // Calculate tax on excess
    const taxOnExcess = excessOverMin * taxBracket.rate;

    // Total annual tax
    const annualTax = annualBaseTax + taxOnExcess;

    // Convert to monthly tax
    const monthlyTax = annualTax / 12;

    // Check if minimum wage
    const isMinimumWage = grossSalary <= this.minimumWage;

    return {
      monthlyTaxableIncome,
      annualTaxableIncome,
      taxBracket: {
        minSalary: taxBracket.minSalary,
        maxSalary: taxBracket.maxSalary,
        baseTax: taxBracket.baseTax,
        rate: taxBracket.rate,
      },
      annualBaseTax,
      excessOverMin,
      taxOnExcess,
      annualTax,
      monthlyTax,
      isMinimumWage,
    };
  }

  /**
   * Calculate tax on bonus using progressive rates
   */
  async calculateBonusTax(
    organizationId: string,
    bonusAmount: number,
    otherIncome: number = 0,
    date: Date = new Date()
  ): Promise<number> {
    // Total annual income including bonus
    const totalAnnualIncome = otherIncome + bonusAmount;

    // Get tax bracket for total income
    const taxBracket = await this.taxBracketController.findApplicableBracket(
      organizationId,
      totalAnnualIncome / 12,
      date
    );

    if (!taxBracket) {
      throw new Error('No tax bracket found for the given income');
    }

    // Calculate tax on total income
    const excessOverMin = Math.max(0, totalAnnualIncome - taxBracket.minSalary);
    const totalTax = taxBracket.baseTax + (excessOverMin * taxBracket.rate);

    // Calculate tax on regular income (already paid)
    let regularTax = 0;
    if (otherIncome > 0) {
      const regularBracket = await this.taxBracketController.findApplicableBracket(
        organizationId,
        otherIncome / 12,
        date
      );
      
      if (regularBracket) {
        const regularExcess = Math.max(0, otherIncome - regularBracket.minSalary);
        regularTax = regularBracket.baseTax + (regularExcess * regularBracket.rate);
      }
    }

    // Tax on bonus = total tax - regular tax
    const bonusTax = Math.max(0, totalTax - regularTax);

    return bonusTax;
  }

  /**
   * Generate tax calculator for payroll period
   */
  async generateTaxCalculator(
    organizationId: string,
    payrollPeriod: { start: Date; end: Date }
  ): Promise<{
    organizationId: string;
    payrollPeriod: { start: Date; end: Date };
    taxTables: Array<{
      effectiveDate: string;
      brackets: Array<{
        minSalary: number;
        maxSalary: number | null;
        baseTax: number;
        rate: number;
      }>;
    }>;
  }> {
    // Get all tax brackets effective during the period
    const taxBrackets = await this.taxBracketController.findBracketsByDateRange(
      organizationId,
      payrollPeriod.start,
      payrollPeriod.end
    );

    // Group by effective date
    const bracketGroups = new Map<string, any[]>();
    taxBrackets.forEach(bracket => {
      const key = bracket.effectiveFrom.toISOString().split('T')[0];
      if (!bracketGroups.has(key)) bracketGroups.set(key, []);
      bracketGroups.get(key)!.push({
        minSalary: bracket.minSalary,
        maxSalary: bracket.maxSalary,
        baseTax: bracket.baseTax,
        rate: bracket.rate,
      });
    });

    // Convert to array format
    const taxTables = Array.from(bracketGroups.entries()).map(([date, brackets]) => ({
      effectiveDate: date,
      brackets: brackets.sort((a, b) => a.minSalary - b.minSalary),
    }));

    return {
      organizationId,
      payrollPeriod,
      taxTables,
    };
  }

  /**
   * Validate tax computation
   */
  async validateTaxComputation(
    organizationId: string,
    computation: TaxCalculationDetails
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate monthly taxable income
    if (computation.monthlyTaxableIncome < 0) {
      errors.push('Monthly taxable income cannot be negative');
    }

    // Validate annual taxable income
    if (computation.annualTaxableIncome < 0) {
      errors.push('Annual taxable income cannot be negative');
    }

    // Validate tax bracket
    if (computation.taxBracket.rate < 0 || computation.taxBracket.rate > 1) {
      errors.push('Tax rate must be between 0 and 1');
    }

    if (computation.taxBracket.baseTax < 0) {
      errors.push('Base tax cannot be negative');
    }

    // Validate tax calculations
    if (computation.annualTax < 0) {
      errors.push('Annual tax cannot be negative');
    }

    if (computation.monthlyTax < 0) {
      errors.push('Monthly tax cannot be negative');
    }

    // Validate minimum wage exemption
    if (computation.isMinimumWage && computation.monthlyTax > 0) {
      errors.push('Minimum wage earners should have zero tax');
    }

    // Verify bracket is still valid
    const currentBracket = await this.taxBracketController.findApplicableBracket(
      organizationId,
      computation.monthlyTaxableIncome
    );

    if (!currentBracket || currentBracket.id !== computation.taxBracket.minSalary.toString()) {
      errors.push('Tax bracket is no longer applicable');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get tax summary for organization
   */
  async getTaxSummary(
    organizationId: string,
    year: number
  ): Promise<TaxSummary> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Get all tax brackets for the year
    const taxBrackets = await this.taxBracketController.findBracketsByDateRange(
      organizationId,
      startDate,
      endDate
    );

    // This would typically query payroll records
    // For now, returning placeholder data
    return {
      organizationId,
      year,
      totalWithholdingTax: 0,
      totalTaxableIncome: 0,
      averageTaxRate: 0,
      employeeCount: 0,
      taxBrackets,
    };
  }

  /**
   * Get applicable tax exemptions for employee
   */
  async getTaxExemptions(
    employeeId: string,
    date: Date = new Date()
  ): Promise<TaxExemption[]> {
    const exemptions: TaxExemption[] = [];

    // Check minimum wage exemption
    // This would typically check employee's salary
    exemptions.push({
      type: 'MINIMUM_WAGE',
      amount: this.minimumWage,
      description: 'Minimum wage exemption',
    });

    // TODO: Add personal and dependent exemptions based on employee data

    return exemptions;
  }
}
