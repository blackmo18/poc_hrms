import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { payrollSummaryService } from '@/lib/service/payroll-summary.service';
import { requiresAdmin } from '@/lib/auth/middleware';

// Mock dependencies
vi.mock('@/lib/service/payroll-summary.service', () => ({
  payrollSummaryService: {
    getStatusCounts: vi.fn(),
  },
}));

vi.mock('@/lib/auth/middleware', () => ({
  requiresAdmin: vi.fn((req, handler) => handler(req)),
}));

describe('/api/payroll/status/counts/route', () => {
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      url: 'http://localhost/api/payroll/status/counts?organizationId=org-123&departmentId=dept-456',
      user: {
        id: 'user-123',
        organizationId: 'org-123',
        roles: ['ADMIN'],
      },
    };
    
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should fetch status counts with query parameters', async () => {
      const mockStatusCounts = {
        DRAFT: 2,
        COMPUTED: 3,
        APPROVED: 3,
        RELEASED: 2,
        VOIDED: 0,
      };

      vi.mocked(payrollSummaryService.getStatusCounts).mockResolvedValue(mockStatusCounts);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(payrollSummaryService.getStatusCounts).toHaveBeenCalledWith(
        'org-123',
        'dept-456',
        expect.any(Date),
        expect.any(Date)
      );

      expect(data).toEqual(mockStatusCounts);
      expect(response.status).toBe(200);
    });

    it('should use current month when no period specified', async () => {
      const mockStatusCounts = {
        DRAFT: 0,
        COMPUTED: 0,
        APPROVED: 0,
        RELEASED: 0,
        VOIDED: 0,
      };

      vi.mocked(payrollSummaryService.getStatusCounts).mockResolvedValue(mockStatusCounts);

      const request = {
        ...mockRequest,
        url: 'http://localhost/api/payroll/status/counts?organizationId=org-123',
      };

      await GET(request);

      expect(payrollSummaryService.getStatusCounts).toHaveBeenCalledWith(
        'org-123',
        undefined,
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should return 400 when organizationId is missing', async () => {
      const request = {
        ...mockRequest,
        url: 'http://localhost/api/payroll/status/counts',
      };

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('should handle period parameters', async () => {
      const mockStatusCounts = {
        DRAFT: 1,
        COMPUTED: 1,
        APPROVED: 1,
        RELEASED: 1,
        VOIDED: 0,
      };

      vi.mocked(payrollSummaryService.getStatusCounts).mockResolvedValue(mockStatusCounts);

      const request = {
        ...mockRequest,
        url: 'http://localhost/api/payroll/status/counts?organizationId=org-123&periodStart=2024-01-01&periodEnd=2024-01-31',
      };

      await GET(request);

      expect(payrollSummaryService.getStatusCounts).toHaveBeenCalledWith(
        'org-123',
        undefined,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
    });

    it('should return 500 on service error', async () => {
      vi.mocked(payrollSummaryService.getStatusCounts).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch payroll status counts');
    });
  });
});
