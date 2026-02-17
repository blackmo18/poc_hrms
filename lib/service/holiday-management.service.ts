import { holidayController } from '@/lib/controllers/holiday.controller';
import { HolidayType } from '@prisma/client';
import { IHolidayService } from '@/lib/interfaces/holiday.interface';

export class HolidayService implements IHolidayService {
  /**
   * Create a holiday template
   */
  async createHolidayTemplate(data: {
    organizationId: string;
    name: string;
    description?: string;
    created_by?: string;
  }): Promise<any> {
    try {
      const template = await holidayController.createHolidayTemplate(
        data.organizationId,
        data.name,
        data.description,
        data.created_by
      );
      return {
        success: true,
        message: 'Holiday template created successfully',
        data: template,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a holiday under a template
   */
  async createHoliday(data: {
    template_id: string;
    organizationId: string;
    date: Date;
    type: HolidayType;
    is_recurring?: boolean;
    created_by?: string;
  }): Promise<any> {
    try {
      // Validate that template exists
      const template = await holidayController.getHolidayTemplateById(data.template_id);
      if (!template) {
        throw new Error('Holiday template not found');
      }

      if (template.organizationId !== data.organizationId) {
        throw new Error('Holiday template does not belong to this organization');
      }

      const holiday = await holidayController.createHoliday({
        template_id: data.template_id,
        organization_id: data.organizationId,
        date: data.date,
        type: data.type,
        is_recurring: data.is_recurring,
        created_by: data.created_by,
      });
      return {
        success: true,
        message: 'Holiday created successfully',
        data: holiday,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get holiday template by ID
   */
  async getHolidayTemplateById(id: string): Promise<any> {
    return await holidayController.getHolidayTemplateById(id);
  }

  /**
   * Get all holiday templates for an organization
   */
  async getHolidayTemplatesByOrganization(organizationId: string): Promise<any[]> {
    return await holidayController.getHolidayTemplatesByOrganization(organizationId);
  }

  /**
   * Get holiday by ID
   */
  async getHolidayById(id: string): Promise<any> {
    return await holidayController.getHolidayById(id);
  }

  /**
   * Get holidays by template
   */
  async getHolidaysByTemplate(templateId: string): Promise<any[]> {
    return await holidayController.getHolidaysByTemplate(templateId);
  }

  /**
   * Get holidays by organization
   */
  async getHolidaysByOrganization(organizationId: string): Promise<any[]> {
    return await holidayController.getHolidaysByOrganization(organizationId);
  }

  /**
   * Assign holiday to calendar
   */
  async assignHolidayToCalendar(data: {
    calendar_id: string;
    holiday_id: string;
    created_by?: string;
  }): Promise<any> {
    try {
      const calendarHoliday = await holidayController.assignHolidayToCalendar(data);
      return {
        success: true,
        message: 'Holiday assigned to calendar successfully',
        data: calendarHoliday,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign holiday to employee
   */
  async assignHolidayToEmployee(data: {
    employee_id: string;
    holiday_id: string;
    created_by?: string;
  }): Promise<any> {
    try {
      // Get the holiday to find its organization
      const holiday = await holidayController.getHolidayById(data.holiday_id);
      if (!holiday) {
        throw new Error('Holiday not found');
      }

      const assignment = await holidayController.assignHolidayToEmployee({
        employeeId: data.employee_id,
        holidayId: data.holiday_id,
        organizationId: holiday.organizationId,
      });
      return {
        success: true,
        message: 'Holiday assigned to employee successfully',
        data: assignment,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get holidays for a calendar
   */
  async getHolidaysForCalendar(calendarId: string): Promise<any[]> {
    return await holidayController.getHolidaysForCalendar(calendarId);
  }

  /**
   * Copy holidays from a system template to create a new template for an organization
   */
  async copyHolidaysFromTemplate(data: {
    organizationId: string;
    sourceTemplateId: string;
    newTemplateName: string;
    targetYear?: number;
  }): Promise<{
    template: any;
    holidays: any[];
    totalCopied: number;
  }> {
    try {
      // Get the source template
      const sourceTemplate = await holidayController.getHolidayTemplateById(data.sourceTemplateId);
      if (!sourceTemplate) {
        throw new Error('Source template not found');
      }

      // Get holidays from source template
      const sourceHolidays = await holidayController.getHolidaysByTemplate(data.sourceTemplateId);
      
      // Create new template
      const newTemplate = await holidayController.createHolidayTemplate(
        data.organizationId,
        data.newTemplateName,
        `Copy of ${sourceTemplate.description || sourceTemplate.name}`,
        undefined
      );

      // Copy holidays to new template
      const copiedHolidays = [];
      for (const holiday of sourceHolidays) {
        let holidayDate = new Date(holiday.date);
        
        // Adjust year if targetYear is specified
        if (data.targetYear) {
          holidayDate.setFullYear(data.targetYear);
        }

        const copiedHoliday = await holidayController.createHoliday({
          template_id: newTemplate.id,
          organization_id: data.organizationId,
          date: holidayDate,
          type: holiday.type,
          is_recurring: holiday.isRecurring,
          // Note: Controller currently hardcodes name as empty string
          // TODO: Update controller to accept name parameter
        });
        
        copiedHolidays.push(copiedHoliday);
      }

      return {
        template: newTemplate,
        holidays: copiedHolidays,
        totalCopied: copiedHolidays.length,
      };
    } catch (error) {
      throw error;
    }
  }
}

export const holidayManagementService = new HolidayService();
