/**
 * Interface for CalendarService
 */
export interface ICalendarService {
  /**
   * Create a calendar
   */
  createCalendar(data: {
    organizationId: string;
    name: string;
    description?: string;
    created_by?: string;
  }): Promise<any>;

  /**
   * Get calendar by ID
   */
  getCalendarById(id: string): Promise<any>;

  /**
   * Get calendars by organization
   */
  getCalendarsByOrganization(organizationId: string): Promise<any[]>;

  /**
   * Update calendar
   */
  updateCalendar(id: string, data: {
    name?: string;
    description?: string;
    updated_by?: string;
  }): Promise<any>;

  /**
   * Delete calendar
   */
  deleteCalendar(id: string): Promise<any>;

  /**
   * Assign calendar to employee
   */
  assignCalendarToEmployee(data: {
    employee_id: string;
    calendar_id: string;
    updated_by?: string;
  }): Promise<any>;

  /**
   * Remove calendar assignment from employee
   */
  removeCalendarFromEmployee(employeeId: string, updatedBy?: string): Promise<any>;

  /**
   * Get calendar assigned to employee
   */
  getCalendarForEmployee(employeeId: string): Promise<any>;
}
