import { calendarController } from '@/lib/controllers/calendar.controller';
import { ICalendarService } from '@/lib/interfaces/calendar.interface';

export class CalendarService implements ICalendarService {
  /**
   * Create a calendar
   */
  async createCalendar(data: {
    organizationId: string;
    name: string;
    description?: string;
    created_by?: string;
  }): Promise<any> {
    try {
      const calendar = await calendarController.createCalendar(data);
      return {
        success: true,
        message: 'Calendar created successfully',
        data: calendar,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get calendar by ID
   */
  async getCalendarById(id: string): Promise<any> {
    return await calendarController.getCalendarById(id);
  }

  /**
   * Get calendars by organization
   */
  async getCalendarsByOrganization(organizationId: string): Promise<any[]> {
    return await calendarController.getCalendarsByOrganization(organizationId);
  }

  /**
   * Update calendar
   */
  async updateCalendar(id: string, data: {
    name?: string;
    description?: string;
    updated_by?: string;
  }): Promise<any> {
    try {
      const calendar = await calendarController.updateCalendar(id, data);
      return {
        success: true,
        message: 'Calendar updated successfully',
        data: calendar,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete calendar
   */
  async deleteCalendar(id: string): Promise<any> {
    try {
      const success = await calendarController.deleteCalendar(id);
      return {
        success,
        message: success ? 'Calendar deleted successfully' : 'Failed to delete calendar',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign calendar to employee
   */
  async assignCalendarToEmployee(data: {
    employee_id: string;
    calendar_id: string;
    updated_by?: string;
  }): Promise<any> {
    try {
      const employee = await calendarController.assignCalendarToEmployee({
        employeeId: data.employee_id,
        calendarId: data.calendar_id,
      });
      return {
        success: true,
        message: 'Calendar assigned to employee successfully',
        data: employee,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove calendar assignment from employee
   */
  async removeCalendarFromEmployee(employeeId: string, updatedBy?: string): Promise<any> {
    try {
      const employee = await calendarController.removeCalendarFromEmployee(employeeId);
      return {
        success: true,
        message: 'Calendar removed from employee successfully',
        data: employee,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get calendar assigned to employee
   */
  async getCalendarForEmployee(employeeId: string): Promise<any> {
    return await calendarController.getCalendarForEmployee(employeeId);
  }
}

export const calendarService = new CalendarService();
