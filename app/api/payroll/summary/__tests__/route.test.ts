import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { payrollSummaryService } from '@/lib/service/payroll-summary.service';
import { requiresAdmin } from '@/lib/auth/middleware';

// Mock dependencies
vi.mock('@/lib/service/payroll-summary.service', () => ({
  payrollSummaryService: {
    generateSummary: vi.fn(),
  },
}));

vi.mock('@/lib/auth/middleware', () => ({
  requiresAdmin: vi.fn((req, handler) => handler(req)),
}));

describe('/api/payroll/summary/route', () => {
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      url: 'http://localhost/api/payroll/summary?organizationId=org-123&departmentId=dept-456&page=1&limit=50',
      user: {
        id: 'user-123',
        organizationId: 'org-123',
        roles: ['ADMIN'],
      },
    };
    
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should fetch payroll summary with query parameters', async () => {
      const mockSummary = {
        organizationId: 'org-123',
        departmentId: 'dept-456',
        cutoffPeriod: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        employees: {
          total: 10,
          eligible: 10,
          ineligible: 0,
          exclusionReasons: {
            missingSalaryConfig: 0,
            missingAttendance: 0,
            missingWorkSchedule: 0
          }
        },
        attendance: {
          totalRecords: 10,
          expectedEmployees: 10,
          employeesWithRecords: 10,
          missingEmployeesCount: 0,
          complete: true
        },
        overtime: {
          totalRequests: 0,
          approvedCount: 0,
          pendingCount: 0
        },
        holidays: {
          affectedEmployeesCount: 0
        },
        readiness: {
          canGenerate: true,
          blockingIssues: [],
          warnings: []
        },
        payrollStatus: {
          currentStatus: 'COMPLETED' as const,
          hasExistingRun: true
        },
        summary: {
          totalPayrolls: 10,
          totalGrossPay: 50000,
          totalDeductions: 10000,
          totalNetPay: 40000,
          statusCounts: {
            DRAFT: 2,
            COMPUTED: 3,
            APPROVED: 3,
            RELEASED: 2,
            VOIDED: 0,
          },
        },
        payrolls: [],
        pagination: {
          page: 1,
          limit: 50,
          totalPages: 1,
          totalRecords: 10,
        },
      };

      vi.mocked(payrollSummaryService.generateSummary).mockResolvedValue(mockSummary);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(payrollSummaryService.generateSummary).toHaveBeenCalledWith(
        'org-123',
        'dept-456',
        expect.any(Date),
        expect.any(Date),
        {
          page: 1,
          limit: 50,
          status: null,
          employeeId: null,
        }
      );

      expect(data).toEqual(mockSummary);
      expect(response.status).toBe(200);
    });

    it('should use current month when no period specified', async () => {
      const mockSummary = {
        organizationId: 'org-123',
        cutoffPeriod: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        employees: {
          total: 0,
          eligible: 0,
          ineligible: 0,
          exclusionReasons: {
            missingSalaryConfig: 0,
            missingAttendance: 0,
            missingWorkSchedule: 0
          }
        },
        attendance: {
          totalRecords: 0,
          expectedEmployees: 0,
          employeesWithRecords: 0,
          missingEmployeesCount: 0,
          complete: true
        },
        overtime: {
          totalRequests: 0,
          approvedCount: 0,
          pendingCount: 0
        },
        holidays: {
          affectedEmployeesCount: 0
        },
        readiness: {
          canGenerate: false,
          blockingIssues: [],
          warnings: []
        },
        payrollStatus: {
          currentStatus: 'PENDING' as const,
          hasExistingRun: false
        },
        summary: { totalPayrolls: 0 },
        payrolls: [],
        pagination: { page: 1, limit: 50, totalPages: 0, totalRecords: 0 },
      };

      vi.mocked(payrollSummaryService.generateSummary).mockResolvedValue(mockSummary);

      const request = {
        ...mockRequest,
        url: 'http://localhost/api/payroll/summary?organizationId=org-123',
      };

      await GET(request);

      expect(payrollSummaryService.generateSummary).toHaveBeenCalledWith(
        'org-123',
        undefined,
        expect.any(Date),
        expect.any(Date),
        {
          page: 1,
          limit: 50,
          status: null,
          employeeId: null,
        }
      );
    });

    it('should return 400 when organizationId is missing', async () => {
      const request = {
        ...mockRequest,
        url: 'http://localhost/api/payroll/summary',
      };

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should handle all query parameters', async () => {
      const mockSummary = {
        organizationId: 'org-123',
        departmentId: 'dept-456',
        cutoffPeriod: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        employees: {
          total: 5,
          eligible: 5,
          ineligible: 0,
          exclusionReasons: {
            missingSalaryConfig: 0,
            missingAttendance: 0,
            missingWorkSchedule: 0
          }
        },
        attendance: {
          totalRecords: 5,
          expectedEmployees: 5,
          employeesWithRecords: 5,
          missingEmployeesCount: 0,
          complete: true
        },
        overtime: {
          totalRequests: 0,
          approvedCount: 0,
          pendingCount: 0
        },
        holidays: {
          affectedEmployeesCount: 0
        },
        readiness: {
          canGenerate: true,
          blockingIssues: [],
          warnings: []
        },
        payrollStatus: {
          currentStatus: 'COMPLETED' as const,
          hasExistingRun: true
        },
        summary: { 
          totalPayrolls: 5,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          statusCounts: {
            DRAFT: 0,
            COMPUTED: 0,
            APPROVED: 0,
            RELEASED: 0,
            VOIDED: 0,
          }
        },
        payrolls: [],
        pagination: { page: 2, limit: 25, totalPages: 1, totalRecords: 5 },
      };

      vi.mocked(payrollSummaryService.generateSummary).mockResolvedValue(mockSummary);

      const request = {
        ...mockRequest,
        url: 'http://localhost/api/payroll/summary?organizationId=org-123&departmentId=dept-456&periodStart=2024-01-01&periodEnd=2024-01-31&status=COMPUTED&employeeId=EMP001&page=2&limit=25',
      };

      await GET(request);

      expect(payrollSummaryService.generateSummary).toHaveBeenCalledWith(
        'org-123',
        'dept-456',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        {
          page: 2,
          limit: 25,
          status: 'COMPUTED',
          employeeId: 'EMP001',
        }
      );
    });

    it('should return 500 on service error', async () => {
      vi.mocked(payrollSummaryService.generateSummary).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch payroll summary');
    });
  });
});
