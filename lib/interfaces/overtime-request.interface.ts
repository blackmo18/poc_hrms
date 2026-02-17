/**
 * Interface for OvertimeRequestService
 */
export interface IOvertimeRequestService {
  /**
   * Submit overtime request with validation
   */
  submitOvertimeRequest(data: {
    employee_id: string;
    organizationId: string;
    work_date: Date;
    requested_minutes: number;
    reason?: string;
    created_by?: string;
  }): Promise<any>;

  /**
   * Approve overtime request with validation
   */
  approveOvertimeRequest(
    id: string,
    approvedMinutes: number,
    approvedByUserId: string,
    updatedBy?: string
  ): Promise<any>;

  /**
   * Reject overtime request
   */
  rejectOvertimeRequest(id: string, updatedBy?: string): Promise<any>;

  /**
   * Cancel overtime request
   */
  cancelOvertimeRequest(id: string, updatedBy?: string): Promise<any>;

  /**
   * Approve overtime request (short alias)
   */
  approve(
    id: string,
    approvedMinutes: number,
    approvedByUserId: string,
    updatedBy?: string
  ): Promise<any>;

  /**
   * Reject overtime request (short alias)
   */
  reject(id: string, updatedBy?: string): Promise<any>;

  /**
   * Get overtime request by ID
   */
  getById(id: string): Promise<any>;

  /**
   * Get overtime requests with filters
   */
  getAll(filters: any, options?: { page?: number; limit?: number }): Promise<any>;

  /**
   * Get pending requests for approval
   */
  getPendingRequests(organizationId?: string, options?: { page?: number; limit?: number }): Promise<any>;

  /**
   * Get payable overtime minutes for an employee on a specific date
   */
  getPayableOvertimeMinutes(employeeId: string, workDate: Date): Promise<number>;
}
