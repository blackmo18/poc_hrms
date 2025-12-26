import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPasswordResetSessionService } from '@/lib/service/password-reset-session.service';
import { CreatePasswordResetSessionSchema, ValidatePasswordResetSessionSchema, ResetPasswordSchema } from '@/lib/models/password-reset-session';

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['password_reset.create'], async (authRequest) => {
    try {
      const body = await request.json();
      const { user_id } = body;

      if (!user_id) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Get authenticated user
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const passwordResetService = getPasswordResetSessionService();
      const resetSession = await passwordResetService.createPasswordResetSession(
        user_id,
        session.user.id
      );

      return NextResponse.json({
        message: 'Password reset session created',
        token: resetSession.token,
        expires_on: resetSession.expired_on,
      }, { status: 201 });

    } catch (error) {
      console.error('Error creating password reset session:', error);
      return NextResponse.json(
        { error: 'Failed to create password reset session' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'validate') {
      // Validate token endpoint
      const validatedData = ValidatePasswordResetSessionSchema.parse(body);
      const passwordResetService = getPasswordResetSessionService();
      const session = await passwordResetService.validateToken(validatedData.token);

      if (!session) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: 'Token validated successfully',
        user_id: session.user_id,
      });

    } else if (body.action === 'reset') {
      // Reset password endpoint
      const validatedData = ResetPasswordSchema.parse(body);
      const passwordResetService = getPasswordResetSessionService();
      const success = await passwordResetService.resetPassword(
        validatedData.token,
        validatedData.new_password
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to reset password. Token may be invalid or expired.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: 'Password reset successfully',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "validate" or "reset"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing password reset request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function for permission checking (similar to other API routes)
async function requiresPermissions(
  request: NextRequest,
  permissions: string[],
  handler: (authRequest: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // For now, we'll allow any authenticated user to create password reset requests
  // In a real implementation, you'd check specific permissions
  return handler({ user: session.user, request });
}
