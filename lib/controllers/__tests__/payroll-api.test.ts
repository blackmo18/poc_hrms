import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/payroll/[id]/approve/route';
import { POST as POST_VOID } from '@/app/api/payroll/[id]/void/route';
import { POST as POST_RELEASE } from '@/app/api/payroll/[id]/release/route';
import { NextRequest } from 'next/server';

// Mock the payroll controller
vi.mock('@/lib/controllers/payroll.controller', () => ({
  payrollController: {
    approvePayroll: vi.fn(),
    voidPayroll: vi.fn(),
    releasePayroll: vi.fn(),
  },
}));

// Mock the permission middleware
vi.mock('@/lib/auth/middleware', () => ({
  requiresPermissions: vi.fn((request, permissions, handler) => {
    // Simulate successful permission check for testing
    const mockUser = {
      id: 'user123',
      email: 'admin@test.com',
      organizationId: 'org123',
      roles: ['SUPER_ADMIN'],
    };
    
    const authRequest = request as any;
    authRequest.user = mockUser;
    
    return handler(authRequest);
  }),
}));

import { payrollController } from '@/lib/controllers/payroll.controller';

describe('Payroll API Routes - Updated Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/payroll/[id]/approve', () => {
    it('should approve payroll successfully', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const userId = 'user123';
      const reason = 'Approved for testing';
      
      const mockPayroll = {
        id: payrollId,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(), // API returns dates as strings
        approvedBy: userId,
        reason,
      };

      (payrollController.approvePayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/approve', {
        method: 'POST',
        body: JSON.stringify({ reason }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
      expect(payrollController.approvePayroll).toHaveBeenCalledWith(payrollId, userId, reason);
    });

    it('should approve payroll without reason', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const userId = 'user123';
      
      const mockPayroll = {
        id: payrollId,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(), // API returns dates as strings
        approvedBy: userId,
      };

      (payrollController.approvePayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/approve', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
      expect(payrollController.approvePayroll).toHaveBeenCalledWith(payrollId, userId, undefined);
    });

    it('should handle payroll controller errors', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const errorMessage = 'Payroll not found';

      (payrollController.approvePayroll as any).mockRejectedValue(new Error(errorMessage));

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/approve', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(errorMessage);
    });

    it('should handle invalid JSON in request body', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/approve', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      // JSON parsing errors are returned as-is from the JSON.parse() call
      expect(data.error).toContain('invalid json');
    });
  });

  describe('POST /api/payroll/[id]/release', () => {
    it('should release payroll successfully', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const userId = 'user123';
      const reason = 'Released for payout';
      
      const mockPayroll = {
        id: payrollId,
        status: 'RELEASED',
        releasedAt: new Date().toISOString(), // API returns dates as strings
        releasedBy: userId,
        reason,
      };

      (payrollController.releasePayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/release', {
        method: 'POST',
        body: JSON.stringify({ reason }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_RELEASE(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
      expect(payrollController.releasePayroll).toHaveBeenCalledWith(payrollId, userId, reason);
    });

    it('should release payroll without reason', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const userId = 'user123';
      
      const mockPayroll = {
        id: payrollId,
        status: 'RELEASED',
        releasedAt: new Date().toISOString(), // API returns dates as strings
        releasedBy: userId,
      };

      (payrollController.releasePayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/release', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_RELEASE(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
      expect(payrollController.releasePayroll).toHaveBeenCalledWith(payrollId, userId, undefined);
    });

    it('should handle release errors', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const errorMessage = 'Payroll not in APPROVED status';

      (payrollController.releasePayroll as any).mockRejectedValue(new Error(errorMessage));

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/release', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_RELEASE(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('POST /api/payroll/[id]/void', () => {
    it('should void payroll successfully', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const userId = 'user123';
      const reason = 'Duplicate entry';
      
      const mockPayroll = {
        id: payrollId,
        status: 'VOIDED',
        voidedAt: new Date().toISOString(), // API returns dates as strings
        voidedBy: userId,
        reason,
      };

      (payrollController.voidPayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/void', {
        method: 'POST',
        body: JSON.stringify({ reason }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_VOID(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
      expect(payrollController.voidPayroll).toHaveBeenCalledWith(payrollId, userId, reason);
    });

    it('should handle void without reason (controller allows it)', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      
      const mockPayroll = {
        id: payrollId,
        status: 'VOIDED',
        voidedAt: new Date().toISOString(),
        voidedBy: 'user123',
        reason: undefined, // Controller accepts undefined reason
      };

      (payrollController.voidPayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/void', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_VOID(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
    });

    it('should handle void errors', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      const reason = 'Test void reason';
      const errorMessage = 'Cannot void payroll in RELEASED status';

      (payrollController.voidPayroll as any).mockRejectedValue(new Error(errorMessage));

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/void', {
        method: 'POST',
        body: JSON.stringify({ reason }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_VOID(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(errorMessage);
    });

    it('should handle void with empty reason (controller allows it)', async () => {
      const payrollId = '01KJ2W7CDSV3KT1QP801WE7H4F';
      
      const mockPayroll = {
        id: payrollId,
        status: 'VOIDED',
        voidedAt: new Date().toISOString(),
        voidedBy: 'user123',
        reason: '', // Controller accepts empty string reason
      };

      (payrollController.voidPayroll as any).mockResolvedValue(mockPayroll);

      const request = new NextRequest('http://localhost:3000/api/payroll/' + payrollId + '/void', {
        method: 'POST',
        body: JSON.stringify({ reason: '' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_VOID(request, { params: Promise.resolve({ id: payrollId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPayroll);
    });
  });

  describe('parameter validation', () => {
    it('should handle missing payroll ID in approve route', async () => {
      const request = new NextRequest('http://localhost:3000/api/payroll//approve', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: '' }) });
      
      expect(response.status).toBe(500);
    });

    it('should handle missing payroll ID in release route', async () => {
      const request = new NextRequest('http://localhost:3000/api/payroll//release', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_RELEASE(request, { params: Promise.resolve({ id: '' }) });
      
      expect(response.status).toBe(500);
    });

    it('should handle missing payroll ID in void route', async () => {
      const request = new NextRequest('http://localhost:3000/api/payroll//void', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Test reason' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST_VOID(request, { params: Promise.resolve({ id: '' }) });
      
      expect(response.status).toBe(500);
    });
  });
});
