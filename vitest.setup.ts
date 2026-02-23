import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PrismaClient as a proper constructor
const mockPrismaClient = vi.fn().mockImplementation(() => ({
  employee: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  payroll: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  payrollEarning: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
  },
  deduction: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
  },
  timeEntry: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  workSchedule: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  overtime: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  holiday: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  holidayTemplate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  taxBracket: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  governmentRate: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  compensation: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  department: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  payrollPeriod: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaClient,
  // Add missing enum exports
  HolidayType: {
    REGULAR: 'REGULAR',
    SPECIAL_NON_WORKING: 'SPECIAL_NON_WORKING',
    COMPANY: 'COMPANY',
    LGU: 'LGU',
  },
  DayType: {
    REGULAR: 'REGULAR',
    SPECIAL_NON_WORKING: 'SPECIAL_NON_WORKING',
    COMPANY: 'COMPANY',
    LGU: 'LGU',
  },
}));

// Mock Prisma instance
vi.mock('@/lib/db', () => ({
  prisma: {
    employee: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payroll: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payrollEarning: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    deduction: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    timeEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workSchedule: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    overtime: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    holiday: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    holidayTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    taxBracket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    governmentRate: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    compensation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    department: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    payrollPeriod: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock relative path imports as well
vi.mock('../db', () => ({
  prisma: {
    employee: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payroll: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payrollEarning: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    deduction: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    timeEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workSchedule: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    overtime: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    holiday: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    holidayTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    taxBracket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    governmentRate: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    compensation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    department: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    payrollPeriod: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock DI Container
vi.mock('@/lib/di/container', () => ({
  DIContainer: {
    getInstance: vi.fn(() => ({
      getEmployeeController: vi.fn(() => ({
        getAll: vi.fn(() => ({ data: [], pagination: { total: 0 } })),
      })),
      getPayrollController: vi.fn(),
      getCompensationController: vi.fn(),
      getOrganizationController: vi.fn(),
      getPayrollCalculationService: vi.fn(),
      getPHDeductionsService: vi.fn(),
      getTimeEntryService: vi.fn(),
      getWorkScheduleService: vi.fn(),
      getLateDeductionPolicyService: vi.fn(),
    })),
  },
  getServiceContainer: vi.fn(() => ({
    getPHDeductionsService: vi.fn(() => ({
      calculateAllDeductions: vi.fn(),
      calculateTax: vi.fn(),
      calculateSSS: vi.fn(),
      calculatePhilhealth: vi.fn(),
      calculatePagibig: vi.fn(),
    })),
  })),
}));

// Mock environment variables
process.env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db' };

// Global test utilities
global.createMockEmployee = (overrides = {}) => ({
  id: 'emp-001',
  employeeId: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  departmentId: 'dept-001',
  organizationId: 'org-001',
  ...overrides,
});

global.createMockCompensation = (overrides = {}) => ({
  id: 'comp-001',
  employeeId: 'emp-001',
  baseSalary: 45000,
  effectiveDate: new Date('2024-01-01'),
  ...overrides,
});

global.createMockPayrollPeriod = (overrides = {}) => ({
  id: 'period-001',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-15'),
  payDate: new Date('2026-02-20'),
  status: 'ACTIVE',
  ...overrides,
});

// Console warnings for tests
console.warn = vi.fn();
console.error = vi.fn();

// Mock Winston logger to prevent actual log output during tests
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
