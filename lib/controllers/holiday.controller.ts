import { prisma } from '../db';
import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { HolidayType } from '@prisma/client';
import { createDateAtMidnightUTC, createDateAtMidnightUTCFromDate } from '@/lib/utils/date-utils';

export class HolidayController {
  /**
   * Get holidays by organization and date period
   */
  async getHolidaysByOrganizationAndPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    return await prisma.holiday.findMany({
      where: {
        organizationId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        type: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Get holiday templates by organization (including system templates)
   */
  async getHolidayTemplatesByOrganizationWithSystem(organizationId: string): Promise<any[]> {
    return await prisma.holidayTemplate.findMany({
      where: {
        OR: [
          { organizationId }, // Organization-specific templates
          { isDefault: true }, // System templates available to all
        ],
      },
      include: {
        holidays: {
          orderBy: {
            date: 'asc',
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Create a holiday template
   */
  async createHolidayTemplate(organizationID: string, name: string, description?: string, createdBy?: string, holidays?: any[]): Promise<any> {
    return await prisma.holidayTemplate.create({
      data: {
        id: generateULID(),
        organizationId: organizationID,
        name: name,
        description: description,
        ...(holidays && holidays.length > 0 && {
          holidays: {
            create: holidays.map(holiday => {
              // Handle date properly - ignore time component, only store date at midnight UTC
              let holidayDate: Date;
              if (typeof holiday.date === 'string') {
                // Extract YYYY-MM-DD part if it's an ISO string
                const dateStr = holiday.date.includes('T') ? holiday.date.split('T')[0] : holiday.date;
                holidayDate = createDateAtMidnightUTC(dateStr);
              } else {
                // If it's already a Date object, convert to UTC midnight
                holidayDate = createDateAtMidnightUTCFromDate(holiday.date);
              }

              return {
                id: generateULID(),
                organizationId: organizationID,
                date: holidayDate,
                name: holiday.name,
                type: holiday.type,
                isPaidIfNotWorked: holiday.isPaidIfNotWorked,
                countsTowardOt: holiday.countsTowardOt,
                rateMultiplier: holiday.rateMultiplier,
                isRecurring: false,
              };
            })
          }
        })
      } as any,
      include: {
        holidays: true
      }
    });
  }

  /**
   * Get holiday template by ID
   */
  async getHolidayTemplateById(id: string): Promise<any> {
    return await prisma.holidayTemplate.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        holidays: {
          include: {
            calendarLinks: {
              include: {
                calendar: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get holiday templates by organization
   */
  async getHolidayTemplatesByOrganization(organizationId: string): Promise<any[]> {
    return await prisma.holidayTemplate.findMany({
      where: { organizationId: organizationId },
      include: {
        holidays: {
          select: {
            id: true,
            date: true,
            type: true,
            isRecurring: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a holiday
   */
  async createHoliday(data: {
    template_id: string;
    organizationId: string;
    date: Date;
    type: HolidayType;
    is_recurring?: boolean;
    created_by?: string;
  }): Promise<any> {
    const id = generateULID();

    return await prisma.holiday.create({
      data: {
        id,
        holidayTemplateId: data.template_id,
        organizationId: data.organizationId,
        date: data.date,
        type: data.type,
        isRecurring: data.is_recurring || false,
        name: '',
        isPaidIfNotWorked: false,
        countsTowardOt: false,
        rateMultiplier: 1.0,
      } as any,
      include: {
        holidayTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get holiday by ID
   */
  async getHolidayById(id: string): Promise<any> {
    return await prisma.holiday.findUnique({
      where: { id },
      include: {
        holidayTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
        calendarLinks: {
          include: {
            calendar: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get holidays by template
   */
  async getHolidaysByTemplate(templateId: string): Promise<any[]> {
    return await prisma.holiday.findMany({
      where: { holidayTemplateId: templateId },
      include: {
        holidayTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get holidays by organization
   */
  async getHolidaysByOrganization(organizationId: string): Promise<any[]> {
    return await prisma.holiday.findMany({
      where: { organizationId: organizationId },
      include: {
        holidayTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
        calendarLinks: {
          include: {
            calendar: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Assign holiday to calendar
   */
  async assignHolidayToCalendar(data: {
    calendar_id: string;
    holiday_id: string;
    created_by?: string;
  }): Promise<any> {
    const id = generateULID();

    // Check if association already exists
    const existing = await prisma.calendarHoliday.findUnique({
      where: {
        calendarId_holidayId: {
          calendarId: data.calendar_id,
          holidayId: data.holiday_id,
        },
      },
    });

    if (existing) {
      throw new Error('Holiday already associated with this calendar');
    }

    return await prisma.calendarHoliday.create({
      data: {
        id,
        calendarId: data.calendar_id,
        holidayId: data.holiday_id,
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
          },
        },
        holiday: {
          select: {
            id: true,
            date: true,
            type: true,
            isRecurring: true,
          },
        },
      },
    });
  }

  /**
   * Remove holiday from calendar
   */
  async removeHolidayFromCalendar(calendarId: string, holidayId: string): Promise<boolean> {
    try {
      await prisma.calendarHoliday.delete({
        where: {
          calendarId_holidayId: {
            calendarId: calendarId,
            holidayId: holidayId,
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get holidays for a calendar
   */
  async getHolidaysForCalendar(calendarId: string): Promise<any[]> {
    const calendarHolidays = await prisma.calendarHoliday.findMany({
      where: { calendarId: calendarId },
      include: {
        holiday: {
          include: {
            holidayTemplate: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return calendarHolidays.map(ch => ch.holiday);
  }

  /**
   * Find holiday by organization, date, and types
   */
  async findHolidayByDateAndType(organizationId: string, date: Date, types: HolidayType[]): Promise<any> {
    return await prisma.holiday.findFirst({
      where: {
        organizationId: organizationId,
        date: date,
        type: {
          in: types,
        },
      },
    });
  }

  /**
   * Find recurring holiday by organization, date pattern, and types
   */
  async findRecurringHolidayByDatePattern(organizationId: string, year: number, month: number, day: number, types: HolidayType[]): Promise<any> {
    return await prisma.holiday.findFirst({
      where: {
        organizationId: organizationId,
        isRecurring: true,
        date: {
          gte: new Date(year, month, day),
          lt: new Date(year, month, day + 1),
        },
        type: {
          in: types,
        },
      },
    });
  }

  /**
   * Get all holidays for an organization within a date range
   */
  async getHolidaysInRange(organizationId: string, startDate: Date, endDate: Date, includeTemplate: boolean = false): Promise<any[]> {
    return await prisma.holiday.findMany({
      where: {
        organizationId: organizationId,
        OR: [
          {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            isRecurring: true,
            date: {
              gte: new Date(2000, 0, 1),
              lte: new Date(2000, 11, 31),
            },
          },
        ],
      },
      include: includeTemplate ? {
        holidayTemplate: {
          include: {
            organization: {
              select: {
                name: true
              }
            }
          }
        },
      } : {
        holidayTemplate: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Find holiday template by ID with all its holidays
   */
  async findTemplateWithHolidays(templateId: string): Promise<any> {
    return await prisma.holidayTemplate.findUnique({
      where: { id: templateId },
      include: {
        holidays: {
          orderBy: { date: 'asc' }
        }
      }
    });
  }

  /**
   * Check if a template name already exists for an organization
   */
  async checkTemplateNameExists(organizationId: string, templateName: string): Promise<boolean> {
    const existing = await prisma.holidayTemplate.findFirst({
      where: {
        organizationId: organizationId,
        name: templateName
      }
    });
    return !!existing;
  }

  /**
   * Create a holiday template with all required fields
   */
  async createFullHolidayTemplate(data: {
    organizationId: string;
    name: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<any> {
    return await prisma.holidayTemplate.create({
      data: {
        id: generateULID(),
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault || false
      }
    });
  }

  /**
   * Create a holiday with all required fields
   */
  async createFullHoliday(data: {
    organizationId: string;
    holidayTemplateId: string;
    name: string;
    date: Date;
    type: HolidayType;
    rateMultiplier: number;
    isPaidIfNotWorked: boolean;
    countsTowardOt: boolean;
    isRecurring?: boolean;
  }): Promise<any> {
    return await prisma.holiday.create({
      data: {
        id: generateULID(),
        organizationId: data.organizationId,
        holidayTemplateId: data.holidayTemplateId,
        name: data.name,
        date: data.date,
        type: data.type,
        rateMultiplier: data.rateMultiplier,
        isPaidIfNotWorked: data.isPaidIfNotWorked,
        countsTowardOt: data.countsTowardOt,
        isRecurring: data.isRecurring || false
      }
    });
  }

  /**
   * Copy holidays from a template to create a new template for an organization
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
    // Get the source template with its holidays
    const sourceTemplate = await prisma.holidayTemplate.findUnique({
      where: { id: data.sourceTemplateId },
      include: { holidays: true }
    });

    if (!sourceTemplate) {
      throw new Error('Source template not found');
    }

    // Create new template
    const newTemplate = await prisma.holidayTemplate.create({
      data: {
        id: generateULID(),
        organizationId: data.organizationId,
        name: data.newTemplateName,
        description: `Copied from "${sourceTemplate.name}"${data.targetYear ? ` for ${data.targetYear}` : ''}`
      }
    });

    // Copy holidays with optional year adjustment
    const copiedHolidays = await Promise.all(
      sourceTemplate.holidays.map(async (holiday) => {
        let adjustedDate = new Date(holiday.date);
        
        // Adjust year if specified
        if (data.targetYear) {
          adjustedDate.setFullYear(data.targetYear);
        }

        return await prisma.holiday.create({
          data: {
            id: generateULID(),
            organizationId: data.organizationId,
            holidayTemplateId: newTemplate.id,
            name: holiday.name,
            date: adjustedDate,
            type: holiday.type,
            rateMultiplier: holiday.rateMultiplier,
            isPaidIfNotWorked: holiday.isPaidIfNotWorked,
            countsTowardOt: holiday.countsTowardOt,
            isRecurring: holiday.isRecurring
          }
        });
      })
    );

    return {
      template: newTemplate,
      holidays: copiedHolidays,
      totalCopied: copiedHolidays.length
    };
  }

  /**
   * Delete a holiday template and all its holidays
   */
  async deleteHolidayTemplate(templateId: string): Promise<void> {
    // Check if template exists
    const template = await prisma.holidayTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Holiday template not found');
    }

    // Prevent deletion of system default templates
    if (template.isDefault) {
      throw new Error('Cannot delete system default templates');
    }

    // Delete the template (holidays will be deleted via cascade)
    await prisma.holidayTemplate.delete({
      where: { id: templateId }
    });
  }

  /**
   * Update a holiday template and its holidays
   */
  async updateHolidayTemplate(templateId: string, data: {
    name?: string;
    description?: string;
    holidays?: any[];
  }) {
    // Check if template exists
    const template = await prisma.holidayTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Holiday template not found');
    }

    // Prevent editing of system default templates
    if (template.isDefault) {
      throw new Error('Cannot edit system default templates');
    }

    // Update template basic info
    const updatedTemplate = await prisma.holidayTemplate.update({
      where: { id: templateId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      }
    });

    // If holidays are provided, update them
    if (data.holidays) {
      // Get existing holidays for this template
      const existingHolidays = await prisma.holiday.findMany({
        where: { holidayTemplateId: templateId }
      });

      // Separate holidays into updates and new creations
      const holidaysToUpdate = data.holidays.filter(holiday => holiday.id);
      const holidaysToCreate = data.holidays.filter(holiday => !holiday.id);

      // Update existing holidays
      for (const holiday of holidaysToUpdate) {
        // Handle date properly - ignore time component, only store date at midnight UTC
        let holidayDate: Date;
        if (typeof holiday.date === 'string') {
          // Extract YYYY-MM-DD part if it's an ISO string
          const dateStr = holiday.date.includes('T') ? holiday.date.split('T')[0] : holiday.date;
          holidayDate = createDateAtMidnightUTC(dateStr);
        } else {
          // If it's already a Date object, convert to UTC midnight
          holidayDate = createDateAtMidnightUTCFromDate(holiday.date);
        }

        await prisma.holiday.update({
          where: { id: holiday.id },
          data: {
            name: holiday.name,
            date: holidayDate,
            type: holiday.type,
            rateMultiplier: holiday.rateMultiplier,
            isPaidIfNotWorked: holiday.isPaidIfNotWorked,
            countsTowardOt: holiday.countsTowardOt,
          }
        });
      }

      // Delete holidays that are no longer in the update list
      const updatedHolidayIds = holidaysToUpdate.map(h => h.id);
      const holidaysToDelete = existingHolidays.filter(h => !updatedHolidayIds.includes(h.id));
      
      if (holidaysToDelete.length > 0) {
        await prisma.holiday.deleteMany({
          where: {
            id: { in: holidaysToDelete.map(h => h.id) }
          }
        });
      }

      // Create new holidays
      if (holidaysToCreate.length > 0) {
        await prisma.holiday.createMany({
          data: holidaysToCreate.map(holiday => {
            // Handle date properly - ignore time component, only store date at midnight UTC
            let holidayDate: Date;
            if (typeof holiday.date === 'string') {
              // Extract YYYY-MM-DD part if it's an ISO string
              const dateStr = holiday.date.includes('T') ? holiday.date.split('T')[0] : holiday.date;
              holidayDate = createDateAtMidnightUTC(dateStr);
            } else {
              // If it's already a Date object, convert to UTC midnight
              holidayDate = createDateAtMidnightUTCFromDate(holiday.date);
            }

            return {
              id: generateULID(),
              organizationId: template.organizationId,
              holidayTemplateId: templateId,
              name: holiday.name,
              date: holidayDate,
              type: holiday.type,
              rateMultiplier: holiday.rateMultiplier,
              isPaidIfNotWorked: holiday.isPaidIfNotWorked,
              countsTowardOt: holiday.countsTowardOt,
              isRecurring: false
            };
          })
        });
      }
    }

    // Return updated template with holidays
    return await prisma.holidayTemplate.findUnique({
      where: { id: templateId },
      include: { holidays: true }
    });
  }
}

export const holidayController = new HolidayController();
