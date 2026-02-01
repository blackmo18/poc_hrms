// app/api/auth/sign-out/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // Get session token from cookies to delete from database
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    // Delete session from database if it exists
    if (sessionToken) {
      await prisma.session.delete({
        where: { id: sessionToken }
      }).catch(() => {
        // Session might not exist, that's okay
      });
    }

    const response = NextResponse.json({ success: true });
    
    // Clear all authentication cookies
    response.cookies.set('better-auth.session_token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 
    });
    
    response.cookies.set('access_token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 
    });
    
    response.cookies.set('refresh_token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 
    });
    
    return response;
    
  } catch (error) {
    console.error('Sign-out error:', error);
    
    // Even if error occurs, try to clear cookies
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('better-auth.session_token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 
    });
    
    response.cookies.set('access_token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 
    });
    
    response.cookies.set('refresh_token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 
    });
    
    return response;
  }
}