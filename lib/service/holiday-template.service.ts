import { HolidayController } from '../controllers/holiday.controller';

export class HolidayTemplateService {
  private holidayController: HolidayController;

  constructor() {
    this.holidayController = new HolidayController();
  }

  /**
   * Get holiday templates by organization (including system templates)
   */
  async getTemplatesByOrganization(organizationId: string) {
    try {
      return await this.holidayController.getHolidayTemplatesByOrganizationWithSystem(organizationId);
    } catch (error) {
      console.error('Error fetching holiday templates:', error);
      throw new Error('Failed to fetch holiday templates');
    }
  }

  /**
   * Get holiday template by ID
   */
  async getTemplateById(id: string) {
    try {
      return await this.holidayController.getHolidayTemplateById(id);
    } catch (error) {
      console.error('Error fetching holiday template:', error);
      throw new Error('Failed to fetch holiday template');
    }
  }

  /**
   * Create a new holiday template
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    organizationId: string;
    holidays?: any[];
  }) {
    try {
      return await this.holidayController.createHolidayTemplate(
        data.organizationId,
        data.name,
        data.description,
        undefined, // createdBy
        data.holidays
      );
    } catch (error) {
      console.error('Error creating holiday template:', error);
      throw new Error('Failed to create holiday template');
    }
  }

  /**
   * Update holiday template
   */
  async updateTemplate(id: string, data: {
    name?: string;
    description?: string;
    holidays?: any[];
  }) {
    try {
      return await this.holidayController.updateHolidayTemplate(id, data);
    } catch (error) {
      console.error('Error updating holiday template:', error);
      throw new Error('Failed to update holiday template');
    }
  }

  /**
   * Delete holiday template
   */
  async deleteTemplate(id: string) {
    try {
      await this.holidayController.deleteHolidayTemplate(id);
    } catch (error) {
      console.error('Error deleting holiday template:', error);
      throw new Error('Failed to delete holiday template');
    }
  }

  /**
   * Copy holidays from a template to create a new template for an organization
   */
  async copyTemplate(data: {
    organizationId: string;
    sourceTemplateId: string;
    newTemplateName: string;
    targetYear?: number;
  }) {
    try {
      return await this.holidayController.copyHolidaysFromTemplate(data);
    } catch (error) {
      console.error('Error copying holiday template:', error);
      throw new Error('Failed to copy holiday template');
    }
  }
}
