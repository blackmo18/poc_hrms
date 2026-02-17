import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PHDeductionsService } from '../ph-deductions.service';
import { TaxBracketPrismaController } from '../../controllers/prisma/tax-bracket.prisma.controller';
import { PhilhealthPrismaController } from '../../controllers/prisma/philhealth.prisma.controller';
import { SSSPrismaController } from '../../controllers/prisma/sss.prisma.controller';
import { PagibigPrismaController } from '../../controllers/prisma/pagibig.prisma.controller';

// Mock Controllers
vi.mock('../../controllers/prisma/tax-bracket.prisma.controller');
vi.mock('../../controllers/prisma/philhealth.prisma.controller');
vi.mock('../../controllers/prisma/sss.prisma.controller');
vi.mock('../../controllers/prisma/pagibig.prisma.controller');

describe('PHDeductionsService', () => {
  let service: PHDeductionsService;
  let mockTaxBracketController: any;
  let mockPhilhealthController: any;
  let mockSSSController: any;
  let mockPagibigController: any;
  const mockOrganizationId = 'org-123';

  beforeEach(() => {
    mockTaxBracketController = {
      findApplicableBracket: vi.fn(),
    };
    mockPhilhealthController = {
      findApplicableRate: vi.fn(),
    };
    mockSSSController = {
      findApplicableRate: vi.fn(),
    };
    mockPagibigController = {
      findApplicableRate: vi.fn(),
    };

    service = new PHDeductionsService(
      mockTaxBracketController,
      mockPhilhealthController,
      mockSSSController,
      mockPagibigController
    );
    vi.clearAllMocks();
  });

  describe('calculateTax', () => {
    it('should calculate zero tax for minimum wage earner', async () => {
      const mockTaxBracket = {
        id: '1',
        minSalary: 0,
        maxSalary: 20833,
        baseTax: 0,
        rate: 0,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.calculateTax(mockOrganizationId, 16000);

      expect(result).toBe(0);
      expect(mockTaxBracketController.findApplicableBracket).toHaveBeenCalledWith(
        mockOrganizationId,
        16000,
        expect.any(Date)
      );
    });

    it('should calculate tax for mid-range salary', async () => {
      const mockTaxBracket = {
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.calculateTax(mockOrganizationId, 25000);

      // Annual taxable income: 25000 * 12 = 300,000
      // Excess over min: 300,000 - (20,833 * 12) = 50,004
      // Annual tax: 0 + (50,004 * 0.20) = 10,000.80
      // Monthly tax: 10,000.80 / 12 = 833.40
      expect(result).toBeCloseTo(833.40, 2);
    });

    it('should calculate tax for high salary', async () => {
      const mockTaxBracket = {
        id: '5',
        minSalary: 666667,
        maxSalary: null,
        baseTax: 200000,
        rate: 0.35,
      };

      mockTaxBracketController.findApplicableBracket.mockResolvedValue(mockTaxBracket);

      const result = await service.calculateTax(mockOrganizationId, 700000);

      // Annual taxable income: 700,000 * 12 = 8,400,000
      // Excess over min: 8,400,000 - (666,667 * 12) = 400,000
      // Annual tax: 200,000 + (400,000 * 0.35) = 340,000
      // Monthly tax: 340,000 / 12 = 28,333.33
      expect(result).toBeCloseTo(28333.33, 2);
    });

    it('should throw error if no tax bracket found', async () => {
      mockTaxBracketController.findApplicableBracket.mockResolvedValue(null);

      await expect(service.calculateTax(mockOrganizationId, 25000))
        .rejects.toThrow('No tax bracket found for the given income');
    });
  });

  describe('calculatePhilhealth', () => {
    it('should calculate Philhealth contribution correctly', async () => {
      const mockRate = {
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      };

      mockPhilhealthController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculatePhilhealth(mockOrganizationId, 25000);

      expect(result).toBeCloseTo(687.50, 2); // 25000 * 0.0275
    });

    it('should throw error if no Philhealth rate found', async () => {
      mockPhilhealthController.findApplicableRate.mockResolvedValue(null);

      await expect(service.calculatePhilhealth(mockOrganizationId, 25000))
        .rejects.toThrow('No Philhealth rate found for the given salary');
    });
  });

  describe('calculateSSS', () => {
    it('should calculate SSS contribution for minimum salary', async () => {
      const mockRate = {
        id: '1',
        minSalary: 2000,
        maxSalary: 2249.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      };

      mockSSSController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculateSSS(mockOrganizationId, 2000);

      expect(result).toBeCloseTo(90.00, 2); // 2000 * 0.045
    });

    it('should calculate SSS contribution for mid-range salary', async () => {
      const mockRate = {
        id: '5',
        minSalary: 10000,
        maxSalary: 12499.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      };

      mockSSSController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculateSSS(mockOrganizationId, 12000);

      expect(result).toBeCloseTo(540.00, 2); // 12000 * 0.045
    });

    it('should calculate SSS contribution for maximum salary', async () => {
      const mockRate = {
        id: '14',
        minSalary: 20000,
        maxSalary: null,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      };

      mockSSSController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculateSSS(mockOrganizationId, 25000);

      expect(result).toBeCloseTo(900.00, 2); // 20000 * 0.045 (capped at 20,000)
    });
  });

  describe('calculatePagibig', () => {
    it('should calculate Pagibig contribution with 1% rate', async () => {
      const mockRate = {
        id: '1',
        minSalary: 0,
        maxSalary: 5000,
        employeeRate: 0.01,
        employerRate: 0.02,
      };

      mockPagibigController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculatePagibig(mockOrganizationId, 4000);

      expect(result).toBeCloseTo(40.00, 2); // 4000 * 0.01
    });

    it('should calculate Pagibig contribution with 2% rate', async () => {
      const mockRate = {
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      };

      mockPagibigController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculatePagibig(mockOrganizationId, 10000);

      expect(result).toBeCloseTo(100.00, 2); // 10000 * 0.02
    });

    it('should cap Pagibig contribution at ₱100', async () => {
      const mockRate = {
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      };

      mockPagibigController.findApplicableRate.mockResolvedValue(mockRate);

      const result = await service.calculatePagibig(mockOrganizationId, 10000);

      expect(result).toBeCloseTo(100.00, 2); // Capped at ₱100
    });
  });

  describe('calculateAllDeductions', () => {
    it('should calculate all deductions for mid-range salary', async () => {
      // Mock tax bracket
      mockTaxBracketController.findApplicableBracket.mockResolvedValue({
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      });

      // Mock Philhealth
      mockPhilhealthController.findApplicableRate.mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      });

      // Mock SSS
      mockSSSController.findApplicableRate.mockResolvedValue({
        id: '5',
        minSalary: 10000,
        maxSalary: 12499.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      });

      // Mock Pagibig
      mockPagibigController.findApplicableRate.mockResolvedValue({
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      });

      const result = await service.calculateAllDeductions(mockOrganizationId, 25000);

      expect(result).toEqual({
        tax: expect.closeTo(833.40, 2),
        philhealth: expect.closeTo(687.50, 2),
        sss: expect.closeTo(540.00, 2),
        pagibig: expect.closeTo(100.00, 2),
        totalDeductions: expect.closeTo(2160.90, 2),
        taxableIncome: expect.closeTo(22832.50, 2), // 25000 - 687.50 - 540 - 100
      });
    });

    it('should handle zero deductions for minimum wage', async () => {
      // Mock tax bracket (zero rate)
      mockTaxBracketController.findApplicableBracket.mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: 20833,
        baseTax: 0,
        rate: 0,
      });

      // Mock other contributions
      mockPhilhealthController.findApplicableRate.mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      });

      mockSSSController.findApplicableRate.mockResolvedValue({
        id: '1',
        minSalary: 2000,
        maxSalary: 2249.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      });

      mockPagibigController.findApplicableRate.mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: 5000,
        employeeRate: 0.01,
        employerRate: 0.02,
      });

      const result = await service.calculateAllDeductions(mockOrganizationId, 16000);

      expect(result.tax).toBe(0); // Minimum wage exemption
      expect(result.totalDeductions).toBeGreaterThan(0); // Still has gov't contributions
    });
  });

  describe('getContributionRates', () => {
    it('should return detailed breakdown of all contribution rates', async () => {
      // Mock all rates
      mockTaxBracketController.findApplicableBracket.mockResolvedValue({
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      });

      mockPhilhealthController.findApplicableRate.mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      });

      mockSSSController.findApplicableRate.mockResolvedValue({
        id: '5',
        minSalary: 10000,
        maxSalary: 12499.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      });

      mockPagibigController.findApplicableRate.mockResolvedValue({
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      });

      const result = await service.getContributionRates(mockOrganizationId, 25000);

      expect(result).toHaveProperty('tax');
      expect(result).toHaveProperty('philhealth');
      expect(result).toHaveProperty('sss');
      expect(result).toHaveProperty('pagibig');

      expect(result.tax).toEqual({
        bracket: {
          minSalary: 20833,
          maxSalary: 33333,
          baseTax: 0,
          rate: 0.20,
        },
        annualTaxableIncome: 300000,
        monthlyTax: expect.closeTo(833.40, 2),
      });

      expect(result.philhealth.employeeShare).toBeCloseTo(687.50, 2);
      expect(result.sss.employeeShare).toBeCloseTo(540.00, 2);
      expect(result.pagibig.employeeShare).toBeCloseTo(100.00, 2);
    });
  });
});
