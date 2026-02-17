import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxComputationService } from '../tax-computation.service';
import { TaxBracketPrismaController } from '../../controllers/prisma/tax-bracket.prisma.controller';

// Mock Controller
vi.mock('../../controllers/prisma/tax-bracket.prisma.controller');

describe('TaxComputationService', () => {
  let service: TaxComputationService;
  let mockTaxBracketController: any;
  const mockOrganizationId = 'org-123';

  beforeEach(() => {
    mockTaxBracketController = {
      findApplicableBracket: vi.fn(),
      findMany: vi.fn(),
    };
    
    service = new TaxComputationService(mockTaxBracketController);
    vi.clearAllMocks();
  });

  describe('computeWithholdingTax', () => {
    it('should compute tax with detailed breakdown for mid-range salary', async () => {
      const mockTaxBracket = {
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const grossSalary = 25000;
      const governmentDeductions = 1327.50; // Philhealth + SSS + Pagibig

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        grossSalary,
        governmentDeductions
      );

      expect(result).toEqual({
        monthlyTaxableIncome: 23672.50, // 25000 - 1327.50
        annualTaxableIncome: 284070, // 23672.50 * 12
        taxBracket: {
          minSalary: 20833,
          maxSalary: 33333,
          baseTax: 0,
          rate: 0.20,
        },
        annualBaseTax: 0, // 0 * 12
        excessOverMin: 33674, // 284070 - (20833 * 12)
        taxOnExcess: 6734.80, // 33674 * 0.20
        annualTax: 6734.80,
        monthlyTax: 561.23, // 6734.80 / 12
        isMinimumWage: false,
      });
    });

    it('should return zero tax for minimum wage earner', async () => {
      const mockTaxBracket = {
        id: '1',
        minSalary: 0,
        maxSalary: 20833,
        baseTax: 0,
        rate: 0,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        16000,
        0
      );

      expect(result.monthlyTax).toBe(0);
      expect(result.isMinimumWage).toBe(true);
    });

    it('should compute tax for high salary with maximum bracket', async () => {
      const mockTaxBracket = {
        id: '5',
        minSalary: 666667,
        maxSalary: null,
        baseTax: 200000,
        rate: 0.35,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        700000,
        10000
      );

      expect(result.monthlyTax).toBeGreaterThan(20000);
      expect(result.taxBracket.rate).toBe(0.35);
    });

    it('should handle negative taxable income', async () => {
      const mockTaxBracket = {
        id: '1',
        minSalary: 0,
        maxSalary: 20833,
        baseTax: 0,
        rate: 0,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        5000,
        6000 // Government deductions exceed gross salary
      );

      expect(result.monthlyTaxableIncome).toBe(0);
      expect(result.annualTaxableIncome).toBe(0);
    });
  });

  describe('calculateBonusTax', () => {
    it('should calculate tax on bonus using progressive rates', async () => {
      // Mock tax bracket for total compensation
      const mockTaxBracket = {
        id: '3',
        minSalary: 33333,
        maxSalary: 666667,
        baseTax: 2500,
        rate: 0.25,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const bonusAmount = 50000;
      const otherIncome = 300000; // Annual regular income

      const result = await service.calculateBonusTax(
        mockOrganizationId,
        bonusAmount,
        otherIncome
      );

      // Total annual: 300,000 + 50,000 = 350,000
      // Tax on total: 2,500 + ((350,000 - 400,000) * 0.25) = 2,500 (no excess yet)
      // Tax on regular: 2,500 + ((300,000 - 400,000) * 0.25) = 2,500 (no excess yet)
      // Since both are in same bracket with no excess, bonus tax should be proportional
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(bonusAmount); // Tax shouldn't exceed bonus
    });

    it('should handle zero other income', async () => {
      const mockTaxBracket = {
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.calculateBonusTax(
        mockOrganizationId,
        50000,
        0
      );

      // Should calculate tax based on bonus alone
      expect(result).toBeCloseTo(8333.33, 2); // 50,000 * 0.20 (annual)
    });

    it('should handle bonus that pushes to higher tax bracket', async () => {
      // Mock for higher bracket
      const mockTaxBracket = {
        id: '3',
        minSalary: 33333,
        maxSalary: 666667,
        baseTax: 2500,
        rate: 0.25,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.calculateBonusTax(
        mockOrganizationId,
        200000,
        300000 // Already at edge of bracket
      );

      expect(result).toBeGreaterThan(0);
      // Bonus pushes to higher bracket, so marginal rate applies
    });
  });

  describe('generateTaxCalculator', () => {
    it('should generate tax calculator for payroll period', async () => {
      const mockTaxBrackets = [
        {
          id: '1',
          minSalary: 0,
          maxSalary: 20833,
          baseTax: 0,
          rate: 0,
          effectiveFrom: new Date('2024-01-01'),
        },
        {
          id: '2',
          minSalary: 20833,
          maxSalary: 33333,
          baseTax: 0,
          rate: 0.20,
          effectiveFrom: new Date('2024-01-01'),
        },
      ];

      mockTaxBracketController.findMany.mockResolvedValue(mockTaxBrackets);

      const payrollPeriod = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      const result = await service.generateTaxCalculator(
        mockOrganizationId,
        payrollPeriod
      );

      expect(result).toEqual({
        organizationId: mockOrganizationId,
        payrollPeriod,
        taxTables: [
          {
            effectiveDate: '2024-01-01',
            brackets: expect.arrayContaining([
              expect.objectContaining({ minSalary: 0 }),
              expect.objectContaining({ minSalary: 20833 }),
            ]),
          },
        ],
      });
    });
  });

  describe('validateTaxComputation', () => {
    it('should validate correct tax computation', async () => {
      const validComputation = {
        monthlyTaxableIncome: 23672.50,
        annualTaxableIncome: 284070,
        taxBracket: {
          minSalary: 20833,
          maxSalary: 33333,
          baseTax: 0,
          rate: 0.20,
        },
        annualBaseTax: 0,
        excessOverMin: 33674,
        taxOnExcess: 6734.80,
        annualTax: 6734.80,
        monthlyTax: 561.23,
        isMinimumWage: false,
      };

      const result = await service.validateTaxComputation(
        mockOrganizationId,
        validComputation
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect negative taxable income', async () => {
      const invalidComputation = {
        monthlyTaxableIncome: -100,
        annualTaxableIncome: -1200,
        taxBracket: {
          minSalary: 0,
          maxSalary: 20833,
          baseTax: 0,
          rate: 0,
        },
        annualBaseTax: 0,
        excessOverMin: 0,
        taxOnExcess: 0,
        annualTax: 0,
        monthlyTax: 0,
        isMinimumWage: false,
      };

      const result = await service.validateTaxComputation(
        mockOrganizationId,
        invalidComputation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Monthly taxable income cannot be negative');
    });

    it('should detect invalid tax rate', async () => {
      const invalidComputation = {
        monthlyTaxableIncome: 25000,
        annualTaxableIncome: 300000,
        taxBracket: {
          minSalary: 20833,
          maxSalary: 33333,
          baseTax: 0,
          rate: 1.5, // Invalid rate > 1
        },
        annualBaseTax: 0,
        excessOverMin: 33674,
        taxOnExcess: 0,
        annualTax: 0,
        monthlyTax: 0,
        isMinimumWage: false,
      };

      const result = await service.validateTaxComputation(
        mockOrganizationId,
        invalidComputation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tax rate must be between 0 and 1');
    });

    it('should detect minimum wage earner with tax', async () => {
      const invalidComputation = {
        monthlyTaxableIncome: 16000,
        annualTaxableIncome: 192000,
        taxBracket: {
          minSalary: 0,
          maxSalary: 20833,
          baseTax: 0,
          rate: 0,
        },
        annualBaseTax: 0,
        excessOverMin: 0,
        taxOnExcess: 0,
        annualTax: 0,
        monthlyTax: 100, // Should be 0 for minimum wage
        isMinimumWage: true,
      };

      const result = await service.validateTaxComputation(
        mockOrganizationId,
        invalidComputation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum wage earners should have zero tax');
    });
  });

  describe('getTaxSummary', () => {
    it('should return tax summary for organization', async () => {
      const mockTaxBrackets = [
        {
          id: '1',
          minSalary: 0,
          maxSalary: 20833,
          baseTax: 0,
          rate: 0,
        },
        {
          id: '2',
          minSalary: 20833,
          maxSalary: 33333,
          baseTax: 0,
          rate: 0.20,
        },
      ];

      mockTaxBracketController.findMany.mockResolvedValue(mockTaxBrackets);

      const result = await service.getTaxSummary(mockOrganizationId, 2024);

      expect(result).toEqual({
        organizationId: mockOrganizationId,
        year: 2024,
        totalWithholdingTax: 0,
        totalTaxableIncome: 0,
        averageTaxRate: 0,
        employeeCount: 0,
        taxBrackets: mockTaxBrackets,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle salary exactly at bracket boundary', async () => {
      const mockTaxBracket = {
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        20833, // Exactly at bracket boundary
        0
      );

      expect(result.taxBracket.minSalary).toBe(20833);
      expect(result.monthlyTaxableIncome).toBe(20833);
    });

    it('should handle very high salary', async () => {
      const mockTaxBracket = {
        id: '5',
        minSalary: 666667,
        maxSalary: null,
        baseTax: 200000,
        rate: 0.35,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        1000000, // 1 million monthly
        0
      );

      expect(result.monthlyTax).toBeGreaterThan(100000);
      expect(result.taxBracket.rate).toBe(0.35);
    });

    it('should handle zero salary', async () => {
      const mockTaxBracket = {
        id: '1',
        minSalary: 0,
        maxSalary: 20833,
        baseTax: 0,
        rate: 0,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.computeWithholdingTax(
        mockOrganizationId,
        0,
        0
      );

      expect(result.monthlyTax).toBe(0);
      expect(result.monthlyTaxableIncome).toBe(0);
    });
  });
});
