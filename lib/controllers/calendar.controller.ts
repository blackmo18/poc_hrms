import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';

export class CalendarController {
  /**
   * Create a calendar
   */
  async createCalendar(data: {
    organizationId: string;
    name: string;
    description?: string;
  }): Promise<any> {
    const id = generateULID();

    return await prisma.calendar.create({
      data: {
        id,
        organization: { connect: { id: data.organizationId } },
        name: data.name,
        description: data.description,
        effectiveFrom: new Date(),
        updatedAt: new Date(),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get calendar by ID
   */
  async getCalendarById(id: string): Promise<any> {
    return await prisma.calendar.findUnique({
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
        },
      },
    });
  }

  /**
   * Get calendars by organization
   */
  async getCalendarsByOrganization(organizationId: string): Promise<any[]> {
    return await prisma.calendar.findMany({
      where: { organizationId },
      include: {
        holidays: {
          include: {
            holiday: {
              select: {
                id: true,
                date: true,
                type: true,
                isRecurring: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update calendar
   */
  async updateCalendar(id: string, data: {
    name?: string;
    description?: string;
  }): Promise<any> {
    return await prisma.calendar.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete calendar
   */
  async deleteCalendar(id: string): Promise<boolean> {
    try {
      await prisma.calendar.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Assign calendar to employee
   */
  async assignCalendarToEmployee(data: {
    employeeId: string;
    calendarId: string;
  }): Promise<any> {
    return await prisma.employee.update({
      where: { id: data.employeeId },
      data: {
        calendarId: data.calendarId,
        updatedAt: new Date(),
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Remove calendar assignment from employee
   */
  async removeCalendarFromEmployee(employeeId: string): Promise<any> {
    return await prisma.employee.update({
      where: { id: employeeId },
      data: {
        calendarId: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get calendar assigned to employee
   */
  async getCalendarForEmployee(employeeId: string): Promise<any> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        calendar: {
          include: {
            holidays: {
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
            },
          },
        },
      },
    });

    return employee?.calendar || null;
  }
}

export const calendarController = new CalendarController();
