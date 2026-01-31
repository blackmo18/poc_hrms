import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/overtime-requests/route';

// Mock the dependencies
vi.mock('@/lib/auth/middleware', () => ({
  requiresPermissions: vi.fn(),
}));

vi.mock('@/lib/service/employee.service', () => ({
  getEmployeeService: vi.fn(),
}));

vi.mock('@/lib/controllers/overtime.controller', () => ({
  overtimeController: {
    createOvertimeRequest: vi.fn(),
    getOvertimeRequests: vi.fn(),
  },
}));

import { requiresPermissions } from '@/lib/auth/middleware';
import { getEmployeeService } from '@/lib/service/employee.service';
import { overtimeController } from '@/lib/controllers/overtime.controller';

describe('/api/overtime-requests POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful overtime request creation', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', organizationId: 'org-123', roles: ['EMPLOYEE'] };
    const mockEmployee = { id: 'emp-123', organizationId: 'org-123', firstName: 'John', lastName: 'Doe' };
    const mockResponse = new Response(JSON.stringify({ success: true, data: { id: 'ot-123' } }));

    // Mock requiresPermissions to call the callback
    (requiresPermissions as any).mockImplementation((request: NextRequest, permissions: string[], callback: Function) => {
      return callback({ user: mockUser });
    });

    // Mock employee service
    const mockEmployeeService = {
      getByUserId: vi.fn().mockResolvedValue(mockEmployee),
    };
    (getEmployeeService as any).mockReturnValue(mockEmployeeService);

    // Mock controller
    (overtimeController.createOvertimeRequest as any).mockResolvedValue(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/overtime-requests', {
      method: 'POST',
      body: JSON.stringify({
        workDate: '2024-01-01',
        reason: 'Test overtime',
        otType: 'REGULAR_DAY',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const result = await POST(request);

    expect(requiresPermissions).toHaveBeenCalledWith(request, ['overtime.request'], expect.any(Function));
    expect(getEmployeeService).toHaveBeenCalled();
    expect(mockEmployeeService.getByUserId).toHaveBeenCalledWith('user-123');
    expect(overtimeController.createOvertimeRequest).toHaveBeenCalledWith(request, 'emp-123', 'org-123');

    expect(result).toEqual(mockResponse);
  });

  it('should handle employee not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', organizationId: 'org-123', roles: ['EMPLOYEE'] };

    // Mock requiresPermissions to call the callback
    (requiresPermissions as any).mockImplementation((request: NextRequest, permissions: string[], callback: Function) => {
      return callback({ user: mockUser });
    });

    // Mock employee service to return null
    const mockEmployeeService = {
      getByUserId: vi.fn().mockResolvedValue(null),
    };
    (getEmployeeService as any).mockReturnValue(mockEmployeeService);

    const request = new NextRequest('http://localhost:3000/api/overtime-requests', {
      method: 'POST',
      body: JSON.stringify({
        workDate: '2024-01-01',
        reason: 'Test overtime',
        otType: 'REGULAR_DAY',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const result = await POST(request);

    expect(result.status).toBe(404);
    const data = await result.json();
    expect(data.error).toBe('Employee record not found');
  });

  it('should handle internal server error', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', organizationId: 'org-123', roles: ['EMPLOYEE'] };

    // Mock requiresPermissions to call the callback
    (requiresPermissions as any).mockImplementation((request: NextRequest, permissions: string[], callback: Function) => {
      return callback({ user: mockUser });
    });

    // Mock employee service to throw error
    const mockEmployeeService = {
      getByUserId: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    };
    (getEmployeeService as any).mockReturnValue(mockEmployeeService);

    const request = new NextRequest('http://localhost:3000/api/overtime-requests', {
      method: 'POST',
      body: JSON.stringify({
        workDate: '2024-01-01',
        reason: 'Test overtime',
        otType: 'REGULAR_DAY',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const result = await POST(request);

    expect(result.status).toBe(500);
    const data = await result.json();
    expect(data.error).toBe('Internal server error');
  });

  it('should handle successful overtime request history retrieval', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', organizationId: 'org-123', roles: ['EMPLOYEE'] };
    const mockEmployee = { id: 'emp-123', organizationId: 'org-123', firstName: 'John', lastName: 'Doe' };
    const mockOvertimeData = [
      {
        id: 'ot-1',
        workDate: '2024-01-01T00:00:00.000Z',
        requestedMinutes: 120,
        approvedMinutes: 120,
        status: 'APPROVED',
        reason: 'Project deadline',
        remarks: 'Worked extra hours',
        approvedAt: '2024-01-02T00:00:00.000Z',
        approvedByUser: { email: 'jane.smith@techcorp.com' }
      }
    ];
    const mockResponse = new Response(JSON.stringify({ success: true, data: mockOvertimeData }));

    // Mock requiresPermissions to call the callback
    (requiresPermissions as any).mockImplementation((request: NextRequest, permissions: string[], callback: Function) => {
      return callback({ user: mockUser });
    });

    // Mock employee service
    const mockEmployeeService = {
      getByUserId: vi.fn().mockResolvedValue(mockEmployee),
    };
    (getEmployeeService as any).mockReturnValue(mockEmployeeService);

    // Mock controller
    (overtimeController.getOvertimeRequests as any).mockResolvedValue(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/overtime-requests', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    });

    const result = await GET(request);

    expect(requiresPermissions).toHaveBeenCalledWith(request, ['overtime.request'], expect.any(Function));
    expect(getEmployeeService).toHaveBeenCalled();
    expect(mockEmployeeService.getByUserId).toHaveBeenCalledWith('user-123');
    expect(overtimeController.getOvertimeRequests).toHaveBeenCalledWith('emp-123');

    expect(result).toEqual(mockResponse);
  });
});
