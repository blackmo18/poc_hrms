import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPasswordResetSessionService } from '@/lib/service/password-reset-session.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const passwordResetService = getPasswordResetSessionService();

    // Get user's password reset sessions
    const sessions = await passwordResetService.getUserPasswordResetSessions(userId);

    // Get user's password reset logs
    const logs = await passwordResetService.getUserPasswordResetLogs(userId);

    return NextResponse.json({
      sessions,
      logs,
    });

  } catch (error) {
    console.error('Error fetching password reset data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch password reset data' },
      { status: 500 }
    );
  }
}
