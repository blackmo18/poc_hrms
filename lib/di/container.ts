import { PrismaClient } from '@prisma/client';
import { TaxBracketPrismaController } from '../controllers/prisma/tax-bracket.prisma.controller';
import { PhilhealthPrismaController } from '../controllers/prisma/philhealth.prisma.controller';
import { SSSPrismaController } from '../controllers/prisma/sss.prisma.controller';
import { PagibigPrismaController } from '../controllers/prisma/pagibig.prisma.controller';
import { EmployeeGovernmentInfoPrismaController } from '../controllers/prisma/employee-government-info.prisma.controller';
import { PHDeductionsService } from '../service/ph-deductions.service';
import { TaxComputationService } from '../service/tax-computation.service';
import { RateManagementService } from '../service/rate-management.service';
import { PayrollCalculationService } from '../service/payroll-calculation.service';
import { GovernmentContributionController } from '../controllers/government-contribution.controller';

/**
 * Dependency Injection Container
 * Manages all service and controller instances
 */
export class DIContainer {
  private static instance: DIContainer;
  private prisma: PrismaClient;
  
  // Controllers
  private taxBracketController: TaxBracketPrismaController;
  private philhealthController: PhilhealthPrismaController;
  private sssController: SSSPrismaController;
  private pagibigController: PagibigPrismaController;
  private employeeGovernmentInfoController: EmployeeGovernmentInfoPrismaController;
  
  // Services
  private phDeductionsService: PHDeductionsService;
  private taxComputationService: TaxComputationService;
  private rateManagementService: RateManagementService;
  private payrollCalculationService: PayrollCalculationService;
  private governmentContributionController: GovernmentContributionController;

  private constructor() {
    this.prisma = new PrismaClient();
    this.initializeControllers();
    this.initializeServices();
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private initializeControllers(): void {
    // Initialize all Prisma controllers
    this.taxBracketController = new TaxBracketPrismaController(this.prisma);
    this.philhealthController = new PhilhealthPrismaController(this.prisma);
    this.sssController = new SSSPrismaController(this.prisma);
    this.pagibigController = new PagibigPrismaController(this.prisma);
    this.employeeGovernmentInfoController = new EmployeeGovernmentInfoPrismaController(this.prisma);
  }

  private initializeServices(): void {
    // Initialize services with injected controllers
    this.phDeductionsService = new PHDeductionsService(
      this.taxBracketController,
      this.philhealthController,
      this.sssController,
      this.pagibigController
    );
    this.taxComputationService = new TaxComputationService(this.taxBracketController);
    this.rateManagementService = new RateManagementService(
      this.taxBracketController,
      this.philhealthController,
      this.sssController,
      this.pagibigController
    );
    
    // Initialize PayrollCalculationService with required dependencies
    this.payrollCalculationService = new PayrollCalculationService(
      this.phDeductionsService
    );

    // Initialize controllers
    this.governmentContributionController = new GovernmentContributionController(
      this.taxBracketController,
      this.philhealthController,
      this.sssController,
      this.pagibigController
    );
  }

  // Getters for services
  public getPHDeductionsService(): PHDeductionsService {
    return this.phDeductionsService;
  }

  public getTaxComputationService(): TaxComputationService {
    return this.taxComputationService;
  }

  public getRateManagementService(): RateManagementService {
    return this.rateManagementService;
  }

  public getPayrollCalculationService(): PayrollCalculationService {
    return this.payrollCalculationService;
  }

  // Getters for controllers
  public getTaxBracketController(): TaxBracketPrismaController {
    return this.taxBracketController;
  }

  public getPhilhealthController(): PhilhealthPrismaController {
    return this.philhealthController;
  }

  public getSSSController(): SSSPrismaController {
    return this.sssController;
  }

  public getPagibigController(): PagibigPrismaController {
    return this.pagibigController;
  }

  public getEmployeeGovernmentInfoController(): EmployeeGovernmentInfoPrismaController {
    return this.employeeGovernmentInfoController;
  }

  public getGovernmentContributionController(): GovernmentContributionController {
    return this.governmentContributionController;
  }

  /**
   * Disconnect Prisma client
   */
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Factory function to get services
 * This provides a clean interface for the rest of the application
 */
export const getServiceContainer = () => DIContainer.getInstance();

/**
 * Example usage in API routes:
 * 
 * ```typescript
 * import { getServiceContainer } from '@/lib/di/container';
 * 
 * const container = getServiceContainer();
 * const taxService = container.getTaxComputationService();
 * 
 * const result = await taxService.computeWithholdingTax(orgId, salary, deductions);
 * ```
 */
