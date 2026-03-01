import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { payrollSummaryApiService } from '@/lib/service/payroll-summary-api.service';
import { PayrollRecord } from '@/lib/service/payroll-summary-api.service';

// Mock fetch
global.fetch = vi.fn();

describe('Payroll Service - Updated Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('approvePayroll', () => {
    it('should approve payroll successfully', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const mockResponse = {
        id: mockPayrollId,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: 'user123'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payrollSummaryApiService.approvePayroll(mockPayrollId);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/approve`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should approve payroll with reason', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const reason = 'Approved for Q1 2024';
      const mockResponse = {
        id: mockPayrollId,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: 'user123',
        reason
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payrollSummaryApiService.approvePayroll(mockPayrollId, reason);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/approve`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle approval API error', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const errorMessage = 'Insufficient permissions';

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: errorMessage }),
      });

      await expect(payrollSummaryApiService.approvePayroll(mockPayrollId))
        .rejects.toThrow(errorMessage);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/approve`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
    });

    it('should handle network error during approval', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';

      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(payrollSummaryApiService.approvePayroll(mockPayrollId))
        .rejects.toThrow('Network error');
    });
  });

  describe('releasePayroll', () => {
    it('should release payroll successfully', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const mockResponse = {
        id: mockPayrollId,
        status: 'RELEASED',
        releasedAt: new Date().toISOString(),
        releasedBy: 'user123'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payrollSummaryApiService.releasePayroll(mockPayrollId);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/release`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should release payroll with reason', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const reason = 'Released for Q1 2024 payout';
      const mockResponse = {
        id: mockPayrollId,
        status: 'RELEASED',
        releasedAt: new Date().toISOString(),
        releasedBy: 'user123',
        reason
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payrollSummaryApiService.releasePayroll(mockPayrollId, reason);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/release`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle release API error', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const errorMessage = 'Payroll not in APPROVED status';

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: errorMessage }),
      });

      await expect(payrollSummaryApiService.releasePayroll(mockPayrollId))
        .rejects.toThrow(errorMessage);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/release`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
    });
  });

  describe('voidPayroll', () => {
    it('should void payroll successfully', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const reason = 'Duplicate payroll entry';
      const mockResponse = {
        id: mockPayrollId,
        status: 'VOIDED',
        voidedAt: new Date().toISOString(),
        voidedBy: 'user123',
        reason
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payrollSummaryApiService.voidPayroll(mockPayrollId, reason);

      expect(fetch).toHaveBeenCalledWith(
        `/api/payroll/${mockPayrollId}/void`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('bulk operations', () => {
    describe('bulkApprovePayrolls', () => {
      it('should bulk approve payrolls successfully', async () => {
        const mockPayrollIds = ['01KJ2W7CDSV3KT1QP801WE7H4F', '01KJ2W7CDSV3KT1QP801WE7H4G'];
        const mockResponse = {
          success: mockPayrollIds,
          failures: [],
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await payrollSummaryApiService.bulkApprovePayrolls(mockPayrollIds);

        expect(fetch).toHaveBeenCalledWith(
          '/api/payroll/bulk/approve',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payrollIds: mockPayrollIds }),
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should handle partial success in bulk approval', async () => {
        const mockPayrollIds = ['01KJ2W7CDSV3KT1QP801WE7H4F', '01KJ2W7CDSV3KT1QP801WE7H4G'];
        const mockResponse = {
          success: [mockPayrollIds[0]],
          failures: [{ id: mockPayrollIds[1], error: 'Insufficient permissions' }],
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await payrollSummaryApiService.bulkApprovePayrolls(mockPayrollIds);

        expect(result.success).toHaveLength(1);
        expect(result.failures).toHaveLength(1);
      });
    });

    describe('bulkReleasePayrolls', () => {
      it('should bulk release payrolls successfully', async () => {
        const mockPayrollIds = ['01KJ2W7CDSV3KT1QP801WE7H4F', '01KJ2W7CDSV3KT1QP801WE7H4G'];
        const mockResponse = {
          success: mockPayrollIds,
          failures: [],
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await payrollSummaryApiService.bulkReleasePayrolls(mockPayrollIds);

        expect(fetch).toHaveBeenCalledWith(
          '/api/payroll/bulk/release',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payrollIds: mockPayrollIds }),
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should handle empty payroll list in bulk release', async () => {
        const mockPayrollIds: string[] = [];
        const mockResponse = {
          success: [],
          failures: [],
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await payrollSummaryApiService.bulkReleasePayrolls(mockPayrollIds);

        expect(result.success).toHaveLength(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle malformed API response', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(payrollSummaryApiService.approvePayroll(mockPayrollId))
        .rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout errors', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';

      (fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(payrollSummaryApiService.approvePayroll(mockPayrollId))
        .rejects.toThrow('Request timeout');
    });

    it('should handle different HTTP status codes', async () => {
      const mockPayrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const testCases = [
        { status: 401, error: 'Authentication required' },
        { status: 403, error: 'Insufficient permissions' },
        { status: 404, error: 'Payroll not found' },
        { status: 500, error: 'Internal server error' },
      ];

      for (const testCase of testCases) {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          json: async () => ({ error: testCase.error }),
        });

        await expect(payrollSummaryApiService.approvePayroll(mockPayrollId))
          .rejects.toThrow(testCase.error);
      }
    });
  });
});
