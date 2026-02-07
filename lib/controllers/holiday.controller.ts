import { prisma } from '../db';
import { HolidayType } from '@prisma/client';
import { generateULID } from '../utils/ulid.service';

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
   * Create a holiday template
   */
  async createHolidayTemplate(organizationID: string, name: string, description?: string, createdBy?: string): Promise<any> {
    return await prisma.holidayTemplate.create({
      data: {
        id: generateULID(),
        organizationId: organizationID,
        name: name,
        description: description,
      } as any,
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
    organization_id: string;
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
        organizationId: data.organization_id,
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
   * Assign holiday to employee
   */
  async assignHolidayToEmployee(data: {
    employeeId: string;
    holidayId: string;
    organizationId: string;
    createdBy?: string;
  }): Promise<any> {
    const id = generateULID();

    // Check if association already exists
    const existing = await prisma.employeeHolidayAssignment.findUnique({
      where: {
        employeeId_holidayId: {
          employeeId: data.employeeId,
          holidayId: data.holidayId,
        },
      },
    });

    if (existing) {
      throw new Error('Holiday already assigned to this employee');
    }

    return await prisma.employeeHolidayAssignment.create({
      data: {
        id,
        employeeId: data.employeeId,
        holidayId: data.holidayId,
        organizationId: data.organizationId,
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
  async getHolidaysInRange(organizationId: string, startDate: Date, endDate: Date): Promise<any[]> {
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
      include: {
        holidayTemplate: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}

export const holidayController = new HolidayController();
