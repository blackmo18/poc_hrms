import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';
import { CreateUserPasswordResetLog, UserPasswordResetLog } from '@/lib/models/password-reset-session';

export class PasswordResetLogController {
  async createLog(data: CreateUserPasswordResetLog): Promise<UserPasswordResetLog | null> {
    try {
      return await prisma.userPasswordResetLog.create({
        data: {
          id: generateULID(),
          userId: data.user_id,
          token: data.token || generateULID(),
          expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
        } as any,
      });
    } catch (error) {
      // Log the error but don't throw to prevent breaking the main flow
      console.error('Failed to create password reset log:', error);
      return null;
    }
  }

  async getLogsByUserId(userId: string): Promise<UserPasswordResetLog[]> {
    return await prisma.userPasswordResetLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLogsByToken(token: string): Promise<UserPasswordResetLog | null> {
    return await prisma.userPasswordResetLog.findUnique({
      where: { token },
    });
  }

  async getAllLogs(limit: number = 100, offset: number = 0): Promise<UserPasswordResetLog[]> {
    return await prisma.userPasswordResetLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getLogCount(): Promise<number> {
    return await prisma.userPasswordResetLog.count();
  }

  async deleteLog(id: string): Promise<UserPasswordResetLog> {
    return await prisma.userPasswordResetLog.delete({
      where: { id },
    });
  }

  async deleteLogsByUserId(userId: string): Promise<{ count: number }> {
    const result = await prisma.userPasswordResetLog.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.userPasswordResetLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  // Predefined action constants
  static readonly ACTIONS = {
    PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
    PASSWORD_RESET_VALIDATED: 'PASSWORD_RESET_VALIDATED',
    PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
    PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',
    PASSWORD_RESET_EXPIRED: 'PASSWORD_RESET_EXPIRED',
    PASSWORD_RESET_CANCELLED: 'PASSWORD_RESET_CANCELLED',
    PASSWORD_RESET_ATTEMPTED: 'PASSWORD_RESET_ATTEMPTED',
  } as const;
}

export const passwordResetLogController = new PasswordResetLogController();
