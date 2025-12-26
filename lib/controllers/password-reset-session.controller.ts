import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';
import { 
  PasswordResetSession, 
  CreatePasswordResetSession, 
  UserPasswordResetLog, 
  CreateUserPasswordResetLog,
  ResetPassword
} from '@/lib/models/password-reset-session';
import { passwordResetLogController, PasswordResetLogController } from './password-reset-log.controller';
import bcrypt from 'bcryptjs';

export class PasswordResetSessionController {
  async create(data: CreatePasswordResetSession): Promise<PasswordResetSession> {
    // Set expiry to 1 hour from now
    const expired_on = new Date();
    expired_on.setHours(expired_on.getHours() + 1);

    try {
      const passwordResetSession = await prisma.passwordResetSession.create({
        data: {
          id: generateULID(),
          user_id: data.user_id,
          token: data.token,
          requested_by: data.requested_by,
          expired_on,
        },
      });

      // Log the password reset request
      await passwordResetLogController.createLog({
        user_id: data.user_id,
        requested_by: data.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_REQUESTED,
      });

      return passwordResetSession;
    } catch (error) {
      // Log failed attempt
      await passwordResetLogController.createLog({
        user_id: data.user_id,
        requested_by: data.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_FAILED,
      });
      throw error;
    }
  }

  async validate(token: string): Promise<PasswordResetSession | null> {
    const session = await prisma.passwordResetSession.findUnique({
      where: { token },
    });

    if (!session) {
      // Log attempted validation of non-existent token
      await passwordResetLogController.createLog({
        user_id: 'unknown',
        requested_by: 'system',
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_ATTEMPTED,
      });
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expired_on) {
      // Log expired token validation attempt
      await passwordResetLogController.createLog({
        user_id: session.user_id,
        requested_by: session.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_EXPIRED,
      });
      return null;
    }

    // Check if session has already been validated
    if (session.validated) {
      // Log duplicate validation attempt
      await passwordResetLogController.createLog({
        user_id: session.user_id,
        requested_by: session.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_ATTEMPTED,
      });
      return null;
    }

    // Mark session as validated
    const validatedSession = await prisma.passwordResetSession.update({
      where: { id: session.id },
      data: { validated: new Date() },
    });

    // Log successful validation
    await passwordResetLogController.createLog({
      user_id: session.user_id,
      requested_by: session.requested_by,
      action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_VALIDATED,
    });

    return validatedSession;
  }

  async resetPassword(data: ResetPassword): Promise<boolean> {
    // First validate the token
    const session = await prisma.passwordResetSession.findUnique({
      where: { token: data.token },
    });

    if (!session) {
      // Log attempted reset with non-existent token
      await passwordResetLogController.createLog({
        user_id: 'unknown',
        requested_by: 'system',
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_ATTEMPTED,
      });
      return false;
    }

    // Check if session has expired
    if (new Date() > session.expired_on) {
      // Log attempted reset with expired token
      await passwordResetLogController.createLog({
        user_id: session.user_id,
        requested_by: session.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_EXPIRED,
      });
      return false;
    }

    // Check if session has been validated
    if (!session.validated) {
      // Log attempted reset without validation
      await passwordResetLogController.createLog({
        user_id: session.user_id,
        requested_by: session.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_ATTEMPTED,
      });
      return false;
    }

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(data.new_password, 10);

      // Update user password
      await prisma.user.update({
        where: { id: session.user_id },
        data: { password_hash: hashedPassword },
      });

      // Mark session as used by updating validated time
      await prisma.passwordResetSession.update({
        where: { id: session.id },
        data: { validated: new Date() },
      });

      // Log successful password reset
      await passwordResetLogController.createLog({
        user_id: session.user_id,
        requested_by: session.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_COMPLETED,
      });

      return true;
    } catch (error) {
      // Log failed password reset
      await passwordResetLogController.createLog({
        user_id: session.user_id,
        requested_by: session.requested_by,
        action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_FAILED,
      });
      return false;
    }
  }

  async getByUserId(userId: string): Promise<PasswordResetSession[]> {
    return await prisma.passwordResetSession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getValidSessionsByUserId(userId: string): Promise<PasswordResetSession[]> {
    return await prisma.passwordResetSession.findMany({
      where: {
        user_id: userId,
        expired_on: { gt: new Date() },
        validated: null,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async delete(id: string): Promise<PasswordResetSession> {
    return await prisma.passwordResetSession.delete({
      where: { id },
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.passwordResetSession.deleteMany({
      where: {
        expired_on: { lt: new Date() },
      },
    });

    // Log cleanup action
    await passwordResetLogController.createLog({
      user_id: 'system',
      requested_by: 'system',
      action: PasswordResetLogController.ACTIONS.PASSWORD_RESET_EXPIRED,
    });

    return result.count;
  }

  async getLogsByUserId(userId: string): Promise<UserPasswordResetLog[]> {
    return await passwordResetLogController.getLogsByUserId(userId);
  }
}

export const passwordResetSessionController = new PasswordResetSessionController();
