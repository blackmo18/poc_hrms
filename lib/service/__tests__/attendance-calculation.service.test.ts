import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceCalculationService } from '../attendance-calculation.service';
import { timeEntryService } from '../time-entry.service';
import { PayrollCalculationService } from '../payroll-calculation.service';
import { AttendanceStatus, LeaveDay } from '../../types/attendance.types';
import { getLeaveRequestService } from '../leave-request.service';
import { DIContainer } from '../../di/container';

// Mock dependencies
vi.mock('../time-entry.service', () => ({
  timeEntryService: {
    getByEmployeeAndDateRange: vi.fn(),
  },
}));

vi.mock('../leave-request.service', () => ({
  getLeaveRequestService: vi.fn(() => ({
    getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../payroll-calculation.service', () => ({
  PayrollCalculationService: vi.fn().mockImplementation(() => ({
    calculateActualAbsentDays: vi.fn().mockResolvedValue(0),
  })),
}));

vi.mock('../../di/container', () => ({
  DIContainer: {
    getInstance: vi.fn(() => ({
      getPayrollCalculationService: vi.fn(() => ({
        calculateActualAbsentDays: vi.fn().mockResolvedValue(0),
      })),
    })),
  },
}));

describe('AttendanceCalculationService', () => {
  let service: AttendanceCalculationService;
  let mockTimeEntryService: any;
  let mockGetLeaveRequestService: any;
  let mockPayrollCalculationService: any;
  let mockDIContainer: any;

  beforeEach(() => {
    service = new AttendanceCalculationService();
    mockTimeEntryService = vi.mocked(timeEntryService);
    mockGetLeaveRequestService = vi.mocked(getLeaveRequestService);
    mockPayrollCalculationService = vi.mocked(PayrollCalculationService);
    mockDIContainer = vi.mocked(DIContainer);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock return values
    mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);
    mockGetLeaveRequestService().getApprovedLeaveByEmployeeAndDateRange.mockResolvedValue([]);
    mockPayrollCalculationService().calculateActualAbsentDays.mockResolvedValue(0);
  });

  describe('calculateAttendanceStatus', () => {
    const employeeId = 'test-employee-id';
    const periodStart = new Date('2026-03-01');
    const periodEnd = new Date('2026-03-15');

    describe('when employee has no time entries', () => {
      describe('and no approved leave', () => {
        beforeEach(() => {
          mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);
          mockGetLeaveRequestService().getApprovedLeaveByEmployeeAndDateRange.mockResolvedValue([]);
          mockPayrollCalculationService().calculateActualAbsentDays.mockResolvedValue(0);
        });

        it('should return zero payroll eligibility', async () => {
          const result = await service.calculateAttendanceStatus(employeeId, periodStart, periodEnd);

          expect(result.hasTimeEntries).toBe(false);
          expect(result.hasApprovedLeave).toBe(false);
          expect(result.payrollEligible).toBe(false);
          expect(result.presentDays).toBe(0);
          expect(result.leaveDays).toBe(0);
          expect(result.leaveDetails).toEqual([]);
        });

        it('should return 0 present/absent/leave days', async () => {
          const result = await service.calculateAttendanceStatus(employeeId, periodStart, periodEnd);

          expect(result.presentDays).toBe(0);
          expect(result.absentDays).toBe(0);
          expect(result.leaveDays).toBe(0);
        });
      });

      describe('and has approved leave', () => {
        const mockLeaves = [
          {
            id: 'leave-1',
            startDate: new Date('2026-03-05'),
            endDate: new Date('2026-03-05'),
            leaveType: 'SICK',
            isPaid: true,
            updatedAt: new Date('2026-03-01'),
            status: 'APPROVED'
          }
        ];

        beforeEach(() => {
      // Reset the mock and set up specific behavior for this test
      vi.clearAllMocks();
      
      // Setup time entries mock
      mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);
      
      // Setup leave request service mock to return the mock leaves
      const mockLeaveService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue(mockLeaves)
      };
      mockGetLeaveRequestService.mockReturnValue(mockLeaveService);
      
      // Setup payroll calculation service mock
      const mockPayrollService = {
        calculateActualAbsentDays: vi.fn().mockResolvedValue(0)
      };
      mockPayrollCalculationService.mockReturnValue(mockPayrollService);
    });

    it('should return leave payroll eligibility', async () => {
      const result = await service.calculateAttendanceStatus(employeeId, periodStart, periodEnd);

      expect(result.hasTimeEntries).toBe(false);
      expect(result.hasApprovedLeave).toBe(true);
      expect(result.payrollEligible).toBe(true);
      expect(result.leaveDays).toBe(1);
    });

        it('should return correct leave days', async () => {
      const result = await service.calculateAttendanceStatus(employeeId, periodStart, periodEnd);

      expect(result.leaveDays).toBe(1);
      expect(result.leaveDetails).toHaveLength(1);
      expect(result.leaveDetails[0]).toEqual({
        date: new Date('2026-03-05'),
        leaveType: 'SICK',
        isPaid: true,
        approvedAt: new Date('2026-03-01')
      });
    });
      });
    });

    describe('when employee has time entries', () => {
      const mockTimeEntries = [
        { id: 'te-1', employeeId, workDate: new Date('2026-03-02'), clockOutAt: new Date() },
        { id: 'te-2', employeeId, workDate: new Date('2026-03-03'), clockOutAt: new Date() },
        { id: 'te-3', employeeId, workDate: new Date('2026-03-04'), clockOutAt: new Date() },
      ];

      beforeEach(() => {
        mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue(mockTimeEntries);
        mockGetLeaveRequestService().getApprovedLeaveByEmployeeAndDateRange.mockResolvedValue([]);
        mockPayrollCalculationService().calculateActualAbsentDays.mockResolvedValue(0);
      });

      it('should return correct present days', async () => {
        const result = await service.calculateAttendanceStatus(employeeId, periodStart, periodEnd);

        expect(result.hasTimeEntries).toBe(true);
        expect(result.presentDays).toBe(3);
        expect(result.payrollEligible).toBe(true);
      });
    });

    describe('when considerLeaveAsPresent is false', () => {
      beforeEach(() => {
        // Reset the mock and set up specific behavior for this test
        vi.clearAllMocks();
        
        // Setup time entries mock
        mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);
        
        // Setup leave request service mock to return the mock leaves
        const mockLeaveService = {
          getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([
            {
              id: 'leave-1',
              startDate: new Date('2026-03-05'),
              endDate: new Date('2026-03-05'),
              leaveType: 'SICK',
              isPaid: true,
              updatedAt: new Date('2026-03-01'),
              status: 'APPROVED'
            }
          ])
        };
        mockGetLeaveRequestService.mockReturnValue(mockLeaveService);
        
        // Setup payroll calculation service mock
        const mockPayrollService = {
          calculateActualAbsentDays: vi.fn().mockResolvedValue(0)
        };
        mockPayrollCalculationService.mockReturnValue(mockPayrollService);
      });

      it('should not consider leave as payroll eligible', async () => {
        const result = await service.calculateAttendanceStatus(
          employeeId, 
          periodStart, 
          periodEnd, 
          { considerLeaveAsPresent: false }
        );

        expect(result.hasApprovedLeave).toBe(true);
        expect(result.payrollEligible).toBe(false);
      });
    });
  });

  describe('hasWorkActivity', () => {
    const employeeId = 'test-employee-id';
    const periodStart = new Date('2026-03-01');
    const periodEnd = new Date('2026-03-15');

    it('should return true when employee has time entries', async () => {
      mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([
        { id: 'te-1', workDate: new Date('2026-03-02') }
      ]);

      const result = await service.hasWorkActivity(employeeId, periodStart, periodEnd);

      expect(result).toBe(true);
    });

    it('should return false when employee has no time entries', async () => {
      mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);

      const result = await service.hasWorkActivity(employeeId, periodStart, periodEnd);

      expect(result).toBe(false);
    });
  });

  describe('hasApprovedLeave', () => {
    const employeeId = 'test-employee-id';
    const periodStart = new Date('2026-03-01');
    const periodEnd = new Date('2026-03-15');

    it('should return true when employee has approved leave', async () => {
      // Setup mock to return approved leave
      const mockLeaveService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([
          { id: 'leave-1', status: 'APPROVED' }
        ])
      };
      mockGetLeaveRequestService.mockReturnValue(mockLeaveService);

      const result = await service.hasApprovedLeave(employeeId, periodStart, periodEnd);

      expect(result).toBe(true);
    });

    it('should return false when employee has no approved leave', async () => {
      // Setup mock to return empty array
      const mockLeaveService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([])
      };
      mockGetLeaveRequestService.mockReturnValue(mockLeaveService);

      const result = await service.hasApprovedLeave(employeeId, periodStart, periodEnd);

      expect(result).toBe(false);
    });
  });

  describe('determinePayrollEligibility', () => {
    const employeeId = 'test-employee-id';
    const periodStart = new Date('2026-03-01');
    const periodEnd = new Date('2026-03-15');

    describe('when employee has no time entries and no approved leave', () => {
      beforeEach(() => {
        mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);
        mockGetLeaveRequestService().getApprovedLeaveByEmployeeAndDateRange.mockResolvedValue([]);
        mockPayrollCalculationService().calculateActualAbsentDays.mockResolvedValue(0);
      });

      it('should return not eligible with reason', async () => {
        const result = await service.determinePayrollEligibility(employeeId, periodStart, periodEnd);

        expect(result.eligible).toBe(false);
        expect(result.reason).toBe('No time entries and no approved leave during period');
        expect(result.attendanceStatus.hasTimeEntries).toBe(false);
        expect(result.attendanceStatus.hasApprovedLeave).toBe(false);
      });
    });

    describe('when employee has time entries', () => {
      beforeEach(() => {
        mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([
          { id: 'te-1', workDate: new Date('2026-03-02') }
        ]);
        mockGetLeaveRequestService().getApprovedLeaveByEmployeeAndDateRange.mockResolvedValue([]);
        mockPayrollCalculationService().calculateActualAbsentDays.mockResolvedValue(0);
      });

      it('should return eligible', async () => {
        const result = await service.determinePayrollEligibility(employeeId, periodStart, periodEnd);

        expect(result.eligible).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.attendanceStatus.hasTimeEntries).toBe(true);
      });
    });

    describe('when employee has approved leave', () => {
      beforeEach(() => {
        // Reset the mock and set up specific behavior for this test
        vi.clearAllMocks();
        
        // Setup time entries mock
        mockTimeEntryService.getByEmployeeAndDateRange.mockResolvedValue([]);
        
        // Setup leave request service mock to return approved leave
        const mockLeaveService = {
          getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([
            { id: 'leave-1', status: 'APPROVED', leaveType: 'SICK' }
          ])
        };
        mockGetLeaveRequestService.mockReturnValue(mockLeaveService);
        
        // Setup payroll calculation service mock
        const mockPayrollService = {
          calculateActualAbsentDays: vi.fn().mockResolvedValue(0)
        };
        mockPayrollCalculationService.mockReturnValue(mockPayrollService);
      });

      it('should return eligible', async () => {
        const result = await service.determinePayrollEligibility(employeeId, periodStart, periodEnd);

        expect(result.eligible).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.attendanceStatus.hasApprovedLeave).toBe(true);
      });
    });
  });
});
