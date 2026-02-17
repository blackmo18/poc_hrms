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
  }) {
    try {
      // This would need to be implemented in the controller
      throw new Error('Update functionality not yet implemented');
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
      // This would need to be implemented in the controller
      throw new Error('Delete functionality not yet implemented');
    } catch (error) {
      console.error('Error deleting holiday template:', error);
      throw new Error('Failed to delete holiday template');
    }
  }
}
