import { NextRequest, NextResponse } from 'next/server';
// import { getPasswordResetSessionService } from '@/lib/service/password-reset-session.service';
import { ResetPasswordSchema } from '@/lib/models/password-reset-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement password reset
    // const validatedData = ResetPasswordSchema.parse(body);
    
    // const passwordResetService = getPasswordResetSessionService();
    // const success = await passwordResetService.resetPassword(
    //   validatedData.token,
    //   validatedData.new_password
    // );

    // if (!success) {
    //   return NextResponse.json(
    //     { error: 'Failed to reset password. Token may be invalid or expired.' },
    //     { status: 400 }
    //   );
    // }

    return NextResponse.json({
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
