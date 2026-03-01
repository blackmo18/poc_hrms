import { logError, logInfo } from '@/lib/utils/client-logger';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      name: string;
    };
  };
  period: {
    start: string;
    end: string;
  };
  status: 'DRAFT' | 'COMPUTED' | 'APPROVED' | 'RELEASED' | 'VOIDED';
  grossPay: number;
  netPay: number;
  taxableIncome: number;
  totalDeductions: number;
  earnings: PayrollEarning[];
  deductions: Deduction[];
  approvedAt?: string;
  approvedBy?: string;
  releasedAt?: string;
  releasedBy?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollEarning {
  id: string;
  type: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Deduction {
  id: string;
  type: string;
  amount: number;
}

export interface PayrollSummaryFilters {
  organizationId?: string;
  departmentId?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: 'DRAFT' | 'COMPUTED' | 'APPROVED' | 'RELEASED' | 'VOIDED' | 'ALL';
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface PayrollSummaryResponse {
  payrolls: PayrollRecord[];
  summary: {
    totalPayrolls: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    statusCounts: {
      DRAFT: number;
      COMPUTED: number;
      APPROVED: number;
      RELEASED: number;
      VOIDED: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
}

export interface PayrollStatusCounts {
  DRAFT: number;
  COMPUTED: number;
  APPROVED: number;
  RELEASED: number;
  VOIDED: number;
}

export class PayrollSummaryApiService {
  private static instance: PayrollSummaryApiService;

  static getInstance(): PayrollSummaryApiService {
    if (!PayrollSummaryApiService.instance) {
      PayrollSummaryApiService.instance = new PayrollSummaryApiService();
    }
    return PayrollSummaryApiService.instance;
  }

  /**
   * Fetch payroll summary data with filters
   */
  async getPayrollSummary(filters: PayrollSummaryFilters): Promise<PayrollSummaryResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.organizationId) queryParams.append('organizationId', filters.organizationId);
      if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
      if (filters.periodStart) queryParams.append('periodStart', filters.periodStart);
      if (filters.periodEnd) queryParams.append('periodEnd', filters.periodEnd);
      if (filters.status && filters.status !== 'ALL') queryParams.append('status', filters.status);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/payroll/summary?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payroll summary');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to fetch payroll summary', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Get status counts for a specific period
   */
  async getStatusCounts(filters: Omit<PayrollSummaryFilters, 'status' | 'employeeId' | 'page' | 'limit'>): Promise<PayrollStatusCounts> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.organizationId) queryParams.append('organizationId', filters.organizationId);
      if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
      if (filters.periodStart) queryParams.append('periodStart', filters.periodStart);
      if (filters.periodEnd) queryParams.append('periodEnd', filters.periodEnd);

      const response = await fetch(`/api/payroll/status/counts?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch status counts');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to fetch payroll status counts', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Approve individual payroll
   */
  async approvePayroll(payrollId: string, reason?: string): Promise<PayrollRecord> {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve payroll');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to approve payroll', { error: error.message, payrollId, reason });
      throw error;
    }
  }

  /**
   * Release individual payroll
   */
  async releasePayroll(payrollId: string, reason?: string): Promise<PayrollRecord> {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/release`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release payroll');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to release payroll', { error: error.message, payrollId, reason });
      throw error;
    }
  }

  /**
   * Void individual payroll
   */
  async voidPayroll(payrollId: string, reason: string): Promise<PayrollRecord> {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/void`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to void payroll');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to void payroll', { error: error.message, payrollId, reason });
      throw error;
    }
  }

  /**
   * Bulk approve payrolls
   */
  async bulkApprovePayrolls(payrollIds: string[], reason?: string): Promise<{ success: PayrollRecord[]; failures: { id: string; error: string }[] }> {
    try {
      const response = await fetch('/api/payroll/bulk/approve', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payrollIds, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk approve payrolls');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to bulk approve payrolls', { error: error.message, payrollIds, reason });
      throw error;
    }
  }

  /**
   * Bulk release payrolls
   */
  async bulkReleasePayrolls(payrollIds: string[], reason?: string): Promise<{ success: PayrollRecord[]; failures: { id: string; error: string }[] }> {
    try {
      const response = await fetch('/api/payroll/bulk/release', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payrollIds, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk release payrolls');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to bulk release payrolls', { error: error.message, payrollIds, reason });
      throw error;
    }
  }

  /**
   * Get audit trail for a payroll
   */
  async getPayrollAuditTrail(payrollId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/logs`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audit trail');
      }

      return await response.json();
    } catch (error) {
      logError('Failed to fetch payroll audit trail', { error: error.message, payrollId });
      throw error;
    }
  }

  /**
   * Export payroll summary
   */
  async exportPayrollSummary(filters: PayrollSummaryFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.organizationId) queryParams.append('organizationId', filters.organizationId);
      if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
      if (filters.periodStart) queryParams.append('periodStart', filters.periodStart);
      if (filters.periodEnd) queryParams.append('periodEnd', filters.periodEnd);
      if (filters.status && filters.status !== 'ALL') queryParams.append('status', filters.status);

      queryParams.append('format', format);

      const response = await fetch(`/api/payroll/export?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export payroll summary');
      }

      return await response.blob();
    } catch (error) {
      logError('Failed to export payroll summary', { error: error.message, filters, format });
      throw error;
    }
  }
}

// Export singleton instance
export const payrollSummaryApiService = PayrollSummaryApiService.getInstance();
