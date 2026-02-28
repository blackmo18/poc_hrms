import { holidayController } from '@/lib/controllers/holiday.controller';
import { HolidayType } from '@prisma/client';

export class HolidayService {
  /**
   * Check if clocking in is allowed on a given date based on holiday conditions
   */
  async canClockIn(organizationId: string, workDate: Date): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check if the work date falls on a holiday that doesn't allow work
      const holiday = await holidayController.findHolidayByDateAndType(
        organizationId,
        workDate,
        [HolidayType.REGULAR, HolidayType.SPECIAL_NON_WORKING, HolidayType.COMPANY, HolidayType.LGU]
      );

      if (holiday) {
        return {
          allowed: false,
          reason: `Clocking in is not allowed on ${holiday.type} holiday: ${workDate.toDateString()}`
        };
      }

      // Check for recurring holidays
      const recurringHoliday = await holidayController.findRecurringHolidayByDatePattern(
        organizationId,
        workDate.getFullYear(),
        workDate.getMonth(),
        workDate.getDate(),
        [HolidayType.REGULAR, HolidayType.SPECIAL_NON_WORKING, HolidayType.COMPANY, HolidayType.LGU]
      );

      if (recurringHoliday) {
        return {
          allowed: false,
          reason: `Clocking in is not allowed on recurring ${recurringHoliday.type} holiday: ${workDate.toDateString()}`
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking holiday conditions:', error);
      // On error, allow clocking in to avoid blocking legitimate work
      return { allowed: true };
    }
  }

  /**
   * Validate holiday conditions and throw error if clocking in is not allowed
   */
  async validateHolidayCondition(organizationId: string, workDate: Date): Promise<void> {
    const result = await this.canClockIn(organizationId, workDate);

    if (!result.allowed) {
      throw new Error(result.reason || 'Clocking in is not allowed on this date');
    }
  }

  /**
   * Check if a date is a working holiday (where overtime may apply)
   */
  async isWorkingHoliday(organizationId: string, workDate: Date): Promise<boolean> {
    try {
      const holiday = await holidayController.findHolidayByDateAndType(
        organizationId,
        workDate,
        [HolidayType.SPECIAL_WORKING]
      );

      if (holiday) return true;

      // Check for recurring working holidays
      const recurringHoliday = await holidayController.findRecurringHolidayByDatePattern(
        organizationId,
        workDate.getFullYear(),
        workDate.getMonth(),
        workDate.getDate(),
        [HolidayType.SPECIAL_WORKING]
      );

      return !!recurringHoliday;
    } catch (error) {
      console.error('Error checking working holiday:', error);
      return false;
    }
  }

  /**
   * Get all holidays for an organization within a date range
   */
  async getHolidays(organizationId: string, startDate: Date, endDate: Date, includeTemplate: boolean = false) {
    try {
      const holidays = await holidayController.getHolidaysInRange(organizationId, startDate, endDate, includeTemplate);

      // Filter recurring holidays to only include those that fall within the date range
      return holidays.filter(holiday => {
        if (!holiday.is_recurring) {
          return holiday.date >= startDate && holiday.date <= endDate;
        }

        // For recurring holidays, check if the month/day combination falls within range
        const holidayMonth = holiday.date.getMonth();
        const holidayDay = holiday.date.getDate();

        const rangeStart = new Date(startDate.getFullYear(), holidayMonth, holidayDay);
        const rangeEnd = new Date(endDate.getFullYear(), holidayMonth, holidayDay);

        return rangeStart >= startDate && rangeStart <= endDate;
      });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
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
    const { organizationId, sourceTemplateId, newTemplateName, targetYear } = data;

    // Find the source template with its holidays using controller
    const sourceTemplate = await holidayController.findTemplateWithHolidays(sourceTemplateId);

    if (!sourceTemplate) {
      throw new Error('Source template not found');
    }

    // Check if the organization already has a template with this name using controller
    const nameExists = await holidayController.checkTemplateNameExists(organizationId, newTemplateName);

    if (nameExists) {
      throw new Error('A template with this name already exists for your organization');
    }

    // Create new template for the organization using controller
    const newTemplate = await holidayController.createFullHolidayTemplate({
      organizationId: organizationId,
      name: newTemplateName,
      description: `Copied from ${sourceTemplate.name}`,
      isDefault: false
    });

    // Copy holidays with date adjustments using controller
    const copiedHolidays = [];
    for (const sourceHoliday of sourceTemplate.holidays) {
      let holidayDate = sourceHoliday.date;

      // Adjust year if specified
      if (targetYear) {
        holidayDate = new Date(targetYear,
                             sourceHoliday.date.getMonth(),
                             sourceHoliday.date.getDate());
      }

      const newHoliday = await holidayController.createFullHoliday({
        organizationId: organizationId,
        holidayTemplateId: newTemplate.id,
        name: sourceHoliday.name,
        date: holidayDate,
        type: sourceHoliday.type,
        rateMultiplier: sourceHoliday.rateMultiplier,
        isPaidIfNotWorked: sourceHoliday.isPaidIfNotWorked,
        countsTowardOt: sourceHoliday.countsTowardOt,
        isRecurring: sourceHoliday.isRecurring
      });

      copiedHolidays.push(newHoliday);
    }

    return {
      template: {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        isDefault: newTemplate.isDefault
      },
      holidays: copiedHolidays.map(holiday => ({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date.toISOString().split('T')[0],
        type: holiday.type,
        rateMultiplier: holiday.rateMultiplier,
        isPaidIfNotWorked: holiday.isPaidIfNotWorked,
        countsTowardOt: holiday.countsTowardOt
      })),
      totalCopied: copiedHolidays.length
    };
  }
}

export const holidayService = new HolidayService();
