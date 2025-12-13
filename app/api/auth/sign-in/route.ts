import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { JWTUtils } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const authResult = await JWTUtils.authenticateUser(email, password);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    };

    const response = NextResponse.json({
      user: {
        ...authResult.user,
        username: authResult.user.email
      }
    });

    // Set both access and refresh tokens
    response.cookies.set('access_token', authResult.accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15 // 15 minutes
    });

    response.cookies.set('refresh_token', authResult.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    console.log('response ====>', response)

    return response;

  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}