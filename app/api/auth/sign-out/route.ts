// app/api/auth/sign-out/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear JWT cookies
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