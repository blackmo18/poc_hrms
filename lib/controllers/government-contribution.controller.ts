import { PHDeductionsService } from '../service/ph-deductions.service';
import { RateManagementService } from '../service/rate-management.service';
import { TaxComputationService } from '../service/tax-computation.service';
import { TaxBracketPrismaController } from './prisma/tax-bracket.prisma.controller';
import { PhilhealthPrismaController } from './prisma/philhealth.prisma.controller';
import { SSSPrismaController } from './prisma/sss.prisma.controller';
import { PagibigPrismaController } from './prisma/pagibig.prisma.controller';

export class GovernmentContributionController {
  private phDeductionsService: PHDeductionsService;
  private rateManagementService: RateManagementService;
  private taxComputationService: TaxComputationService;

  constructor(
    private taxBracketController: TaxBracketPrismaController,
    private philhealthController: PhilhealthPrismaController,
    private sssController: SSSPrismaController,
    private pagibigController: PagibigPrismaController
  ) {
    this.phDeductionsService = new PHDeductionsService(
      this.taxBracketController,
      this.philhealthController,
      this.sssController,
      this.pagibigController
    );
    this.rateManagementService = new RateManagementService(
      this.taxBracketController,
      this.philhealthController,
      this.sssController,
      this.pagibigController
    );
    this.taxComputationService = new TaxComputationService(this.taxBracketController);
  }

  // Tax Bracket Management
  async getTaxBrackets(organizationId: string, date?: Date) {
    return await this.rateManagementService.getCurrentTaxRates(
      organizationId,
      date || new Date()
    );
  }

  async createTaxBracket(organizationId: string, data: any) {
    return await this.rateManagementService.createTaxBracket(organizationId, data);
  }

  async updateTaxBracket(id: string, organizationId: string, data: any) {
    return await this.taxBracketController.update(id, data);
  }

  async deleteTaxBracket(id: string, organizationId: string) {
    return await this.taxBracketController.delete(id);
  }

  // Philhealth Contribution Management
  async getPhilhealthRates(organizationId: string, date?: Date) {
    return await this.rateManagementService.getCurrentPhilhealthRates(
      organizationId,
      date || new Date()
    );
  }

  async createPhilhealthRate(organizationId: string, data: any) {
    return await this.rateManagementService.createPhilhealthRate(organizationId, data);
  }

  async updatePhilhealthRate(id: string, organizationId: string, data: any) {
    return await this.philhealthController.update(id, data);
  }

  async deletePhilhealthRate(id: string, organizationId: string) {
    return await this.philhealthController.delete(id);
  }

  // SSS Contribution Management
  async getSSSRates(organizationId: string, date?: Date) {
    return await this.rateManagementService.getCurrentSSSRates(
      organizationId,
      date || new Date()
    );
  }

  async createSSSRate(organizationId: string, data: any) {
    return await this.rateManagementService.createSSSRate(organizationId, data);
  }

  async updateSSSRate(id: string, organizationId: string, data: any) {
    return await this.sssController.update(id, data);
  }

  async deleteSSSRate(id: string, organizationId: string) {
    return await this.sssController.delete(id);
  }

  // Pagibig Contribution Management
  async getPagibigRates(organizationId: string, date?: Date) {
    return await this.rateManagementService.getCurrentPagibigRates(
      organizationId,
      date || new Date()
    );
  }

  async createPagibigRate(organizationId: string, data: any) {
    return await this.rateManagementService.createPagibigRate(organizationId, data);
  }

  async updatePagibigRate(id: string, organizationId: string, data: any) {
    return await this.pagibigController.update(id, data);
  }

  async deletePagibigRate(id: string, organizationId: string) {
    return await this.pagibigController.delete(id);
  }

  // Deduction Calculations
  async calculateDeductions(organizationId: string, grossSalary: number, date?: Date) {
    return await this.phDeductionsService.calculateAllDeductions(
      organizationId,
      grossSalary,
      date || new Date()
    );
  }

  async calculateTax(organizationId: string, taxableIncome: number, date?: Date) {
    return await this.phDeductionsService.calculateTax(
      organizationId,
      taxableIncome,
      date || new Date()
    );
  }

  async getContributionRates(organizationId: string, salary: number, date?: Date) {
    return await this.phDeductionsService.getContributionRates(
      organizationId,
      salary,
      date || new Date()
    );
  }

  // Rate Validation and Transitions
  async validateRates(organizationId: string, date?: Date) {
    return await this.rateManagementService.validateRateConfigurations(
      organizationId,
      date || new Date()
    );
  }

  async getRateTransitions(
    organizationId: string,
    contributionType: 'tax' | 'philhealth' | 'sss' | 'pagibig',
    startDate: Date,
    endDate: Date
  ) {
    return await this.rateManagementService.getRateTransitions(
      organizationId,
      contributionType,
      startDate,
      endDate
    );
  }

  // Tax Computation
  async computeWithholdingTax(
    organizationId: string,
    grossSalary: number,
    governmentDeductions: number,
    date?: Date
  ) {
    return await this.taxComputationService.computeWithholdingTax(
      organizationId,
      grossSalary,
      governmentDeductions,
      date || new Date()
    );
  }

  async calculateBonusTax(
    organizationId: string,
    bonusAmount: number,
    otherIncome: number = 0
  ) {
    return await this.taxComputationService.calculateBonusTax(
      organizationId,
      bonusAmount,
      otherIncome
    );
  }

  async generateTaxCalculator(
    organizationId: string,
    payrollPeriod: { start: Date; end: Date }
  ) {
    return await this.taxComputationService.generateTaxCalculator(
      organizationId,
      payrollPeriod
    );
  }

  async getTaxSummary(organizationId: string, year: number) {
    return await this.taxComputationService.getTaxSummary(organizationId, year);
  }
}
