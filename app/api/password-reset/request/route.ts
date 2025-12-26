import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPasswordResetSessionService } from '@/lib/service/password-reset-session.service';
import { userController } from '@/lib/controllers/user.controller';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email } = body;

    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user by ID or email
    let user;
    if (user_id) {
      user = await userController.getById(user_id);
    } else if (email) {
      user = await userController.getByEmail(email);
    } else {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const passwordResetService = getPasswordResetSessionService();
    const resetSession = await passwordResetService.createPasswordResetSession(
      user.id,
      session.user.id
    );

    return NextResponse.json({
      message: 'Password reset request created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: resetSession.token,
      expires_on: resetSession.expired_on,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating password reset request:', error);
    return NextResponse.json(
      { error: 'Failed to create password reset request' },
      { status: 500 }
    );
  }
}
