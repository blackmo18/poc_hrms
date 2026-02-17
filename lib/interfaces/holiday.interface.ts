import { HolidayType } from '@prisma/client';

/**
 * Interface for HolidayService
 */
export interface IHolidayService {
  /**
   * Create a holiday template
   */
  createHolidayTemplate(data: {
    organizationId: string;
    name: string;
    description?: string;
    created_by?: string;
  }): Promise<any>;

  /**
   * Create a holiday under a template
   */
  createHoliday(data: {
    template_id: string;
    organizationId: string;
    date: Date;
    type: HolidayType;
    is_recurring?: boolean;
    created_by?: string;
  }): Promise<any>;

  /**
   * Get holiday template by ID
   */
  getHolidayTemplateById(id: string): Promise<any>;

  /**
   * Get all holiday templates for an organization
   */
  getHolidayTemplatesByOrganization(organizationId: string): Promise<any[]>;

  /**
   * Get holiday by ID
   */
  getHolidayById(id: string): Promise<any>;

  /**
   * Get holidays by template
   */
  getHolidaysByTemplate(templateId: string): Promise<any[]>;

  /**
   * Get holidays by organization
   */
  getHolidaysByOrganization(organizationId: string): Promise<any[]>;

  /**
   * Assign holiday to calendar
   */
  assignHolidayToCalendar(data: {
    calendar_id: string;
    holiday_id: string;
    created_by?: string;
  }): Promise<any>;

  /**
   * Assign holiday to employee
   */
  assignHolidayToEmployee(data: {
    employee_id: string;
    holiday_id: string;
    created_by?: string;
  }): Promise<any>;

  /**
   * Copy holidays from a system template to create a new template for an organization
   */
  copyHolidaysFromTemplate(data: {
    organizationId: string;
    sourceTemplateId: string;
    newTemplateName: string;
    targetYear?: number;
  }): Promise<{
    template: any;
    holidays: any[];
    totalCopied: number;
  }>;
}
