/**
 * Session validation utility for API routes
 * Validates session token from cookies and returns user payload
 */

import { cookies } from 'next/headers';
import { JWTUtils } from './jwt';
import { prisma } from '@/lib/db';

export interface ValidatedSession {
  userId: string;
  email: string;
  organizationId: string;
  username: string;
}

/**
 * Validate session from request cookies
 * Returns validated session data or null if invalid
 */
export async function validateSession(): Promise<ValidatedSession | null> {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    // Verify the session token (JWT)
    const payload = JWTUtils.verifyAccessToken(sessionToken);

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      username: payload.username
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}
