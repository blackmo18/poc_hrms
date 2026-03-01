import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';
import { PayrollLogData, PayrollLogEntry, PayrollLogAction } from '../types/payroll.types';


export class PayrollLogService {
  private static instance: PayrollLogService;

  static getInstance(): PayrollLogService {
    if (!PayrollLogService.instance) {
      PayrollLogService.instance = new PayrollLogService();
    }
    return PayrollLogService.instance;
  }

  /**
   * Log a payroll action
   */
  async logAction(data: PayrollLogData): Promise<void> {
    try {
      await prisma.payrollLog.create({
        data: {
          id: generateULID(),
          payrollId: data.payrollId,
          action: data.action,
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          reason: data.reason,
          userId: data.userId,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('[PAYROLL_LOG] Error logging action:', error);
      throw error;
    }
  }

  /**
   * Get payroll history
   */
  async getPayrollHistory(payrollId: string): Promise<PayrollLogEntry[]> {
    try {
      const logs = await prisma.payrollLog.findMany({
        where: {
          payrollId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return logs.map((log): PayrollLogEntry => ({
        id: log.id,
        payrollId: log.payrollId,
        action: log.action as PayrollLogAction,
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        reason: log.reason,
        userId: log.userId,
        timestamp: log.timestamp,
        user: {
          id: log.user.id,
          email: log.user.email,
          name: log.user.employee ? `${log.user.employee.firstName} ${log.user.employee.lastName}` : 'Unknown',
        },
      }));
    } catch (error) {
      console.error('[PAYROLL_LOG] Error getting payroll history:', error);
      throw error;
    }
  }

  /**
   * Get organization payroll logs with filters
   */
  async getOrganizationPayrollLogs(
    organizationId: string,
    filters?: {
      action?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {
        payroll: {
          organizationId,
        },
      };

      if (filters?.action) {
        where.action = filters.action;
      }

      if (filters?.userId) {
        where.userId = filters.userId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.payrollLog.findMany({
          where,
          include: {
            payroll: {
              select: {
                id: true,
                employee: {
                  select: {
                    employeeId: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                periodStart: true,
                periodEnd: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        prisma.payrollLog.count({ where }),
      ]);

      return {
        logs: logs.map((log): PayrollLogEntry => ({
          id: log.id,
          payrollId: log.payrollId,
          action: log.action as PayrollLogAction,
          previousStatus: log.previousStatus,
          newStatus: log.newStatus,
          reason: log.reason,
          userId: log.userId,
          timestamp: log.timestamp,
          payroll: {
            id: log.payrollId,
            employee: `${log.payroll.employee.firstName} ${log.payroll.employee.lastName}`,
            employeeId: log.payroll.employee.employeeId,
            period: {
              start: log.payroll.periodStart,
              end: log.payroll.periodEnd,
            },
          },
          user: {
            id: log.user.id,
            email: log.user.email,
            name: log.user.employee ? `${log.user.employee.firstName} ${log.user.employee.lastName}` : 'Unknown',
          },
        })),
        total,
      };
    } catch (error) {
      console.error('[PAYROLL_LOG] Error getting organization logs:', error);
      throw error;
    }
  }
}

export const payrollLogService = PayrollLogService.getInstance();
