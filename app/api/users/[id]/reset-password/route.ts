import { NextRequest, NextResponse } from 'next/server';
import { requiresRoles, AuthenticatedRequest, requiresAdmin } from '@/lib/auth/middleware';
import { getPasswordResetSessionService } from '@/lib/service/password-reset-session.service';
import { getUserService } from '@/lib/service/user.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresAdmin(request, async (authRequest: AuthenticatedRequest) => {
    try {
      const { id: userId } = await params;
      const body = await request.json();
      const { new_password } = body;

      if (!new_password) {
        return NextResponse.json(
          { error: 'New password is required' },
          { status: 400 }
        );
      }

      // Verify user exists
      const userService = getUserService();
      const user = await userService.getById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Create password reset session
      const passwordResetService = getPasswordResetSessionService();
      const resetSession = await passwordResetService.createPasswordResetSession(
        userId,
        authRequest.user.id
      );

      // Generate reset link (for sharing with user)
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetSession.token}`;

      return NextResponse.json({
        message: 'Password reset session created',
        resetLink,
        token: resetSession.token,
        expires_on: resetSession.expired_on,
      }, { status: 200 });

    } catch (error) {
      console.error('Error resetting password:', error);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }
  });
}
