import { ITaxBracketPrismaController } from '../controllers/prisma/tax-bracket.prisma.controller';
import { IPhilhealthPrismaController } from '../controllers/prisma/philhealth.prisma.controller';
import { ISSSPrismaController } from '../controllers/prisma/sss.prisma.controller';
import { IPagibigPrismaController } from '../controllers/prisma/pagibig.prisma.controller';

export interface PHDeductionResult {
  tax: number;
  philhealth: number;
  sss: number;
  pagibig: number;
  totalDeductions: number;
  taxableIncome: number;
}

export interface ContributionRates {
  tax: {
    bracket: {
      minSalary: number;
      maxSalary: number | null;
      baseTax: number;
      rate: number;
    };
    annualTaxableIncome: number;
    monthlyTax: number;
  };
  philhealth: {
    employeeShare: number;
    employerShare: number;
    total: number;
  };
  sss: {
    employeeShare: number;
    employerShare: number;
    ecShare: number;
    total: number;
  };
  pagibig: {
    employeeShare: number;
    employerShare: number;
    total: number;
  };
}

/**
 * PH Deductions Service - Refactored to use Prisma Controllers
 * Handles all Philippine government deductions calculations
 */
export class PHDeductionsService {
  constructor(
    private taxBracketController: ITaxBracketPrismaController,
    private philhealthController: IPhilhealthPrismaController,
    private sssController: ISSSPrismaController,
    private pagibigController: IPagibigPrismaController
  ) {}

  /**
   * Calculate all government deductions for an employee
   */
  async calculateAllDeductions(
    organizationId: string,
    grossSalary: number,
    date: Date = new Date()
  ): Promise<PHDeductionResult> {
    // Calculate individual deductions
    const philhealth = await this.calculatePhilhealth(organizationId, grossSalary, date);
    const sss = await this.calculateSSS(organizationId, grossSalary, date);
    const pagibig = await this.calculatePagibig(organizationId, grossSalary, date);

    // Calculate total government contributions
    const totalGovContributions = philhealth + sss + pagibig;

    // Calculate taxable income (gross pay - government contributions)
    const taxableIncome = Math.max(0, grossSalary - totalGovContributions);

    // Calculate tax based on taxable income
    const tax = await this.calculateTax(organizationId, taxableIncome, date);

    // Calculate total deductions
    const totalDeductions = tax + philhealth + sss + pagibig;

    return {
      tax,
      philhealth,
      sss,
      pagibig,
      totalDeductions,
      taxableIncome,
    };
  }

  /**
   * Calculate withholding tax
   */
  async calculateTax(
    organizationId: string,
    taxableIncome: number,
    date: Date = new Date()
  ): Promise<number> {
    // Get applicable tax bracket
    const taxBracket = await this.taxBracketController.findApplicableBracket(
      organizationId,
      taxableIncome,
      date
    );

    if (!taxBracket) {
      throw new Error('No tax bracket found for the given income');
    }

    // Convert to annual for calculation
    const annualTaxableIncome = taxableIncome * 12;
    const annualBaseTax = taxBracket.baseTax * 12;
    const minAnnualSalary = taxBracket.minSalary * 12;

    // Calculate excess over minimum
    const excessOverMin = Math.max(0, annualTaxableIncome - minAnnualSalary);

    // Calculate tax on excess
    const taxOnExcess = excessOverMin * taxBracket.rate;

    // Total annual tax
    const annualTax = annualBaseTax + taxOnExcess;

    // Convert to monthly tax
    const monthlyTax = annualTax / 12;

    // Round to 2 decimal places
    return Math.round(monthlyTax * 100) / 100;
  }

  /**
   * Calculate Philhealth contribution
   */
  async calculatePhilhealth(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<number> {
    const rate = await this.philhealthController.findApplicableRate(
      organizationId,
      salary,
      date
    );

    if (!rate) {
      throw new Error('No Philhealth rate found for the given salary');
    }

    // Philhealth is calculated on gross salary
    const contribution = salary * rate.employeeRate;

    // Round to 2 decimal places
    return Math.round(contribution * 100) / 100;
  }

  /**
   * Calculate SSS contribution
   */
  async calculateSSS(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<number> {
    const rate = await this.sssController.findApplicableRate(
      organizationId,
      salary,
      date
    );

    if (!rate) {
      throw new Error('No SSS rate found for the given salary');
    }

    // SSS has a maximum salary base
    // Check if this is the highest bracket (no maxSalary)
    if (!rate.maxSalary && salary > rate.minSalary) {
      // Use the minimum salary of the highest bracket as the base
      const maxSalaryBase = rate.minSalary;
      return Math.round(maxSalaryBase * rate.employeeRate * 100) / 100;
    }

    // Regular calculation
    const contribution = salary * rate.employeeRate;

    // Round to 2 decimal places
    return Math.round(contribution * 100) / 100;
  }

  /**
   * Calculate Pagibig contribution
   */
  async calculatePagibig(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<number> {
    const rate = await this.pagibigController.findApplicableRate(
      organizationId,
      salary,
      date
    );

    if (!rate) {
      throw new Error('No Pagibig rate found for the given salary');
    }

    // Calculate contribution
    let contribution = salary * rate.employeeRate;

    // Apply maximum contribution (fixed at ₱100 for Pagibig)
    const MAX_PAGIBIG_CONTRIBUTION = 100;
    contribution = Math.min(contribution, MAX_PAGIBIG_CONTRIBUTION);

    // Round to 2 decimal places
    return Math.round(contribution * 100) / 100;
  }

  /**
   * Get detailed breakdown of all contribution rates
   */
  async getContributionRates(
    organizationId: string,
    salary: number,
    date: Date = new Date()
  ): Promise<ContributionRates> {
    // Get tax bracket and calculate tax
    const taxBracket = await this.taxBracketController.findApplicableBracket(
      organizationId,
      salary,
      date
    );

    if (!taxBracket) {
      throw new Error('No tax bracket found for the given income');
    }

    const annualTaxableIncome = salary * 12;
    const annualBaseTax = taxBracket.baseTax * 12;
    const minAnnualSalary = taxBracket.minSalary * 12;
    const excessOverMin = Math.max(0, annualTaxableIncome - minAnnualSalary);
    const taxOnExcess = excessOverMin * taxBracket.rate;
    const annualTax = annualBaseTax + taxOnExcess;
    const monthlyTax = annualTax / 12;

    // Get Philhealth rate
    const philhealthRate = await this.philhealthController.findApplicableRate(
      organizationId,
      salary,
      date
    );

    if (!philhealthRate) {
      throw new Error('No Philhealth rate found for the given salary');
    }

    // Get SSS rate
    const sssRate = await this.sssController.findApplicableRate(
      organizationId,
      salary,
      date
    );

    if (!sssRate) {
      throw new Error('No SSS rate found for the given salary');
    }

    // Get Pagibig rate
    const pagibigRate = await this.pagibigController.findApplicableRate(
      organizationId,
      salary,
      date
    );

    if (!pagibigRate) {
      throw new Error('No Pagibig rate found for the given salary');
    }

    // Calculate contributions
    const philhealthEmployee = salary * philhealthRate.employeeRate;
    const philhealthEmployer = salary * philhealthRate.employerRate;

    let sssSalary = salary;
    // Apply SSS salary cap if applicable
    if (!sssRate.maxSalary && salary > sssRate.minSalary) {
      sssSalary = sssRate.minSalary;
    }
    const sssEmployee = sssSalary * sssRate.employeeRate;
    const sssEmployer = sssSalary * sssRate.employerRate;
    const sssEC = sssSalary * sssRate.ecRate;

    let pagibigEmployee = salary * pagibigRate.employeeRate;
    const pagibigEmployer = salary * pagibigRate.employerRate;
    
    // Apply Pagibig maximum (fixed at ₱100)
    const MAX_PAGIBIG_CONTRIBUTION = 100;
    pagibigEmployee = Math.min(pagibigEmployee, MAX_PAGIBIG_CONTRIBUTION);

    return {
      tax: {
        bracket: {
          minSalary: taxBracket.minSalary,
          maxSalary: taxBracket.maxSalary,
          baseTax: taxBracket.baseTax,
          rate: taxBracket.rate,
        },
        annualTaxableIncome,
        monthlyTax: Math.round(monthlyTax * 100) / 100,
      },
      philhealth: {
        employeeShare: Math.round(philhealthEmployee * 100) / 100,
        employerShare: Math.round(philhealthEmployer * 100) / 100,
        total: Math.round((philhealthEmployee + philhealthEmployer) * 100) / 100,
      },
      sss: {
        employeeShare: Math.round(sssEmployee * 100) / 100,
        employerShare: Math.round(sssEmployer * 100) / 100,
        ecShare: Math.round(sssEC * 100) / 100,
        total: Math.round((sssEmployee + sssEmployer + sssEC) * 100) / 100,
      },
      pagibig: {
        employeeShare: Math.round(pagibigEmployee * 100) / 100,
        employerShare: Math.round(pagibigEmployer * 100) / 100,
        total: Math.round((pagibigEmployee + pagibigEmployer) * 100) / 100,
      },
    };
  }

  /**
   * Validate that all required rates are configured
   */
  async validateConfiguration(
    organizationId: string,
    date: Date = new Date()
  ): Promise<{
    isValid: boolean;
    missingRates: string[];
  }> {
    const missingRates: string[] = [];
    const testSalary = 25000; // Use a mid-range salary for testing

    try {
      const taxBracket = await this.taxBracketController.findApplicableBracket(
        organizationId,
        testSalary,
        date
      );
      if (!taxBracket) missingRates.push('Tax Bracket');
    } catch (error) {
      missingRates.push('Tax Bracket');
    }

    try {
      const philhealthRate = await this.philhealthController.findApplicableRate(
        organizationId,
        testSalary,
        date
      );
      if (!philhealthRate) missingRates.push('Philhealth');
    } catch (error) {
      missingRates.push('Philhealth');
    }

    try {
      const sssRate = await this.sssController.findApplicableRate(
        organizationId,
        testSalary,
        date
      );
      if (!sssRate) missingRates.push('SSS');
    } catch (error) {
      missingRates.push('SSS');
    }

    try {
      const pagibigRate = await this.pagibigController.findApplicableRate(
        organizationId,
        testSalary,
        date
      );
      if (!pagibigRate) missingRates.push('Pagibig');
    } catch (error) {
      missingRates.push('Pagibig');
    }

    return {
      isValid: missingRates.length === 0,
      missingRates,
    };
  }
}
