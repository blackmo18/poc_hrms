import { ITaxBracketPrismaController } from '../controllers/prisma/tax-bracket.prisma.controller';
import { IPhilhealthPrismaController } from '../controllers/prisma/philhealth.prisma.controller';
import { ISSSPrismaController } from '../controllers/prisma/sss.prisma.controller';
import { IPagibigPrismaController } from '../controllers/prisma/pagibig.prisma.controller';

export interface RateTransition {
  effectiveDate: Date;
  oldRate?: number;
  newRate: number;
  rateType: 'employee' | 'employer' | 'ec';
}

/**
 * Rate Management Service - Refactored to use Prisma Controllers
 * Handles management of all government contribution rates
 */
export class RateManagementService {
  constructor(
    private taxBracketController: ITaxBracketPrismaController,
    private philhealthController: IPhilhealthPrismaController,
    private sssController: ISSSPrismaController,
    private pagibigController: IPagibigPrismaController
  ) {}

  /**
   * Get current tax rates for a specific date
   */
  async getCurrentTaxRates(organizationId: string, date: Date = new Date()) {
    return await this.taxBracketController.findMany(organizationId, {
      effectiveDate: date,
    });
  }

  /**
   * Get current Philhealth rates for a specific date
   */
  async getCurrentPhilhealthRates(organizationId: string, date: Date = new Date()) {
    return await this.philhealthController.findMany(organizationId, {
      effectiveDate: date,
    });
  }

  /**
   * Get current SSS rates for a specific date
   */
  async getCurrentSSSRates(organizationId: string, date: Date = new Date()) {
    return await this.sssController.findMany(organizationId, {
      effectiveDate: date,
    });
  }

  /**
   * Get current Pagibig rates for a specific date
   */
  async getCurrentPagibigRates(organizationId: string, date: Date = new Date()) {
    return await this.pagibigController.findMany(organizationId, {
      effectiveDate: date,
    });
  }

  /**
   * Get rate transitions for a specific contribution type within a date range
   */
  async getRateTransitions(
    organizationId: string,
    contributionType: 'tax' | 'philhealth' | 'sss' | 'pagibig',
    startDate: Date,
    endDate: Date
  ): Promise<RateTransition[]> {
    let transitions: RateTransition[] = [];

    switch (contributionType) {
      case 'tax':
        const taxRates = await this.taxBracketController.findBracketsByDateRange(
          organizationId,
          startDate,
          endDate
        );
        
        // Group by bracket and track changes
        const taxBrackets = new Map<string, any[]>();
        taxRates.forEach(rate => {
          const key = `${rate.minSalary}-${rate.maxSalary}`;
          if (!taxBrackets.has(key)) taxBrackets.set(key, []);
          taxBrackets.get(key)!.push(rate);
        });

        taxBrackets.forEach((rates, bracketKey) => {
          rates.forEach((rate, index) => {
            if (index > 0) {
              transitions.push({
                effectiveDate: rate.effectiveFrom,
                oldRate: rates[index - 1].rate,
                newRate: rate.rate,
                rateType: 'employee',
              });
            }
          });
        });
        break;

      case 'philhealth':
        const philhealthRates = await this.philhealthController.findRatesByDateRange(
          organizationId,
          startDate,
          endDate
        );

        transitions = this.calculateRateTransitions(philhealthRates, 'employee');
        transitions.push(...this.calculateRateTransitions(philhealthRates, 'employer'));
        break;

      case 'sss':
        const sssRates = await this.sssController.findRatesByDateRange(
          organizationId,
          startDate,
          endDate
        );

        transitions = this.calculateRateTransitions(sssRates, 'employee');
        transitions.push(...this.calculateRateTransitions(sssRates, 'employer'));
        transitions.push(...this.calculateRateTransitions(sssRates, 'ec'));
        break;

      case 'pagibig':
        const pagibigRates = await this.pagibigController.findRatesByDateRange(
          organizationId,
          startDate,
          endDate
        );

        transitions = this.calculateRateTransitions(pagibigRates, 'employee');
        transitions.push(...this.calculateRateTransitions(pagibigRates, 'employer'));
        break;
    }

    return transitions.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
  }

  /**
   * Validate rate configurations
   */
  async validateRateConfigurations(organizationId: string, date: Date = new Date()) {
    const issues: string[] = [];

    // Check for gaps in tax brackets
    const taxBrackets = await this.getCurrentTaxRates(organizationId, date);
    for (let i = 1; i < taxBrackets.length; i++) {
      const prev = taxBrackets[i - 1];
      const curr = taxBrackets[i];
      
      if (prev.maxSalary && curr.minSalary > prev.maxSalary + 0.01) {
        issues.push(`Gap in tax brackets: No bracket covers salaries between ₱${prev.maxSalary} and ₱${curr.minSalary}`);
      }
    }

    // Check for gaps in Philhealth rates
    const philhealthRates = await this.getCurrentPhilhealthRates(organizationId, date);
    for (let i = 1; i < philhealthRates.length; i++) {
      const prev = philhealthRates[i - 1];
      const curr = philhealthRates[i];
      
      if (prev.maxSalary && curr.minSalary > prev.maxSalary + 0.01) {
        issues.push(`Gap in Philhealth rates: No rate covers salaries between ₱${prev.maxSalary} and ₱${curr.minSalary}`);
      }
    }

    // Check for gaps in SSS rates
    const sssRates = await this.getCurrentSSSRates(organizationId, date);
    for (let i = 1; i < sssRates.length; i++) {
      const prev = sssRates[i - 1];
      const curr = sssRates[i];
      
      if (prev.maxSalary && curr.minSalary > prev.maxSalary + 0.01) {
        issues.push(`Gap in SSS rates: No rate covers salaries between ₱${prev.maxSalary} and ₱${curr.minSalary}`);
      }
    }

    // Check for gaps in Pagibig rates
    const pagibigRates = await this.getCurrentPagibigRates(organizationId, date);
    for (let i = 1; i < pagibigRates.length; i++) {
      const prev = pagibigRates[i - 1];
      const curr = pagibigRates[i];
      
      if (prev.maxSalary && curr.minSalary > prev.maxSalary + 0.01) {
        issues.push(`Gap in Pagibig rates: No rate covers salaries between ₱${prev.maxSalary} and ₱${curr.minSalary}`);
      }
    }

    // Check for negative rates
    [...taxBrackets, ...philhealthRates, ...sssRates, ...pagibigRates].forEach(rate => {
      if ('rate' in rate && rate.rate < 0) {
        issues.push(`Negative rate detected: ${rate.rate}`);
      }
      if ('employeeRate' in rate && rate.employeeRate < 0) {
        issues.push(`Negative employee rate detected: ${rate.employeeRate}`);
      }
      if ('employerRate' in rate && rate.employerRate < 0) {
        issues.push(`Negative employer rate detected: ${rate.employerRate}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Create new tax bracket
   */
  async createTaxBracket(
    organizationId: string,
    data: {
      minSalary: number;
      maxSalary?: number;
      baseTax: number;
      rate: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.taxBracketController.create({
      ...data,
      organizationId,
    });
  }

  /**
   * Create new Philhealth contribution rate
   */
  async createPhilhealthRate(
    organizationId: string,
    data: {
      minSalary: number;
      maxSalary?: number;
      employeeRate: number;
      employerRate: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.philhealthController.create({
      ...data,
      organizationId,
    });
  }

  /**
   * Create new SSS contribution rate
   */
  async createSSSRate(
    organizationId: string,
    data: {
      minSalary: number;
      maxSalary?: number;
      employeeRate: number;
      employerRate: number;
      ecRate: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.sssController.create({
      ...data,
      organizationId,
    });
  }

  /**
   * Create new Pagibig contribution rate
   */
  async createPagibigRate(
    organizationId: string,
    data: {
      minSalary: number;
      maxSalary?: number;
      employeeRate: number;
      employerRate: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.pagibigController.create({
      ...data,
      organizationId,
    });
  }

  /**
   * Update tax bracket
   */
  async updateTaxBracket(
    id: string,
    data: {
      minSalary?: number;
      maxSalary?: number;
      baseTax?: number;
      rate?: number;
      effectiveFrom?: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.taxBracketController.update(id, data);
  }

  /**
   * Update Philhealth rate
   */
  async updatePhilhealthRate(
    id: string,
    data: {
      minSalary?: number;
      maxSalary?: number;
      employeeRate?: number;
      employerRate?: number;
      effectiveFrom?: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.philhealthController.update(id, data);
  }

  /**
   * Update SSS rate
   */
  async updateSSSRate(
    id: string,
    data: {
      minSalary?: number;
      maxSalary?: number;
      employeeRate?: number;
      employerRate?: number;
      ecRate?: number;
      effectiveFrom?: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.sssController.update(id, data);
  }

  /**
   * Update Pagibig rate
   */
  async updatePagibigRate(
    id: string,
    data: {
      minSalary?: number;
      maxSalary?: number;
      employeeRate?: number;
      employerRate?: number;
      effectiveFrom?: Date;
      effectiveTo?: Date;
    }
  ) {
    return await this.pagibigController.update(id, data);
  }

  /**
   * Delete tax bracket
   */
  async deleteTaxBracket(id: string) {
    return await this.taxBracketController.delete(id);
  }

  /**
   * Delete Philhealth rate
   */
  async deletePhilhealthRate(id: string) {
    return await this.philhealthController.delete(id);
  }

  /**
   * Delete SSS rate
   */
  async deleteSSSRate(id: string) {
    return await this.sssController.delete(id);
  }

  /**
   * Delete Pagibig rate
   */
  async deletePagibigRate(id: string) {
    return await this.pagibigController.delete(id);
  }

  /**
   * Bulk update tax rates
   */
  async bulkUpdateTaxRates(
    organizationId: string,
    updates: Array<{
      id: string;
      baseTax: number;
      rate: number;
    }>
  ) {
    return await this.taxBracketController.bulkUpdateRates(organizationId, updates);
  }

  /**
   * Bulk update Philhealth rates
   */
  async bulkUpdatePhilhealthRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
    }>
  ) {
    return await this.philhealthController.bulkUpdateRates(organizationId, updates);
  }

  /**
   * Bulk update SSS rates
   */
  async bulkUpdateSSSRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
      ecRate: number;
    }>
  ) {
    return await this.sssController.bulkUpdateRates(organizationId, updates);
  }

  /**
   * Bulk update Pagibig rates
   */
  async bulkUpdatePagibigRates(
    organizationId: string,
    updates: Array<{
      id: string;
      employeeRate: number;
      employerRate: number;
    }>
  ) {
    return await this.pagibigController.bulkUpdateRates(organizationId, updates);
  }

  /**
   * Helper method to calculate rate transitions
   */
  private calculateRateTransitions(rates: any[], rateType: 'employee' | 'employer' | 'ec'): RateTransition[] {
    const transitions: RateTransition[] = [];
    const rateKey = rateType === 'employee' ? 'employeeRate' : 
                   rateType === 'employer' ? 'employerRate' : 'ecRate';

    // Group by salary range
    const ranges = new Map<string, any[]>();
    rates.forEach(rate => {
      const key = `${rate.minSalary}-${rate.maxSalary}`;
      if (!ranges.has(key)) ranges.set(key, []);
      ranges.get(key)!.push(rate);
    });

    // Find transitions within each range
    ranges.forEach(rangeRates => {
      rangeRates.sort((a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime());
      
      for (let i = 1; i < rangeRates.length; i++) {
        transitions.push({
          effectiveDate: rangeRates[i].effectiveFrom,
          oldRate: rangeRates[i - 1][rateKey],
          newRate: rangeRates[i][rateKey],
          rateType,
        });
      }
    });

    return transitions;
  }
}
