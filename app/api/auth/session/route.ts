import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// Assuming you have defined these types and utilities elsewhere
import type { NextRequest } from 'next/server'; 

// Placeholder types for the example
type JWTPayload = {
  user: {
    id: number | string;
    email: string;
    name: string;
    role: string;
    organizationId?: number | string;
  }
}
type SessionResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
  } | null;
}

// NOTE: Replace 'JWTUtils.verifyAccessToken' with your actual JWT verification method
const JWTUtils = {
    verifyAccessToken: (token: string) => {
        // Mock verification logic
        try {
            // In a real app, this would use a library like 'jsonwebtoken'
            const [header, payloadBase64, signature] = token.split('.');
            const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
            return JSON.parse(payloadJson) as JWTPayload;
        } catch (e) {
            return null;
        }
    }
}


export async function GET() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ user: null });
    }

    // Verify access token
    let payload = JWTUtils.verifyAccessToken(accessToken);
    
    // If access token is expired, try to refresh it
    if (!payload && refreshToken) {
      const newTokens = await JWTUtils.refreshToken(refreshToken);
      if (newTokens) {
        // Set new tokens in cookies
        const response = NextResponse.json({ user: newTokens.user });
        
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/'
        };

        response.cookies.set('access_token', newTokens.accessToken, {
          ...cookieOptions,
          maxAge: 60 * 15 // 15 minutes
        });

        response.cookies.set('refresh_token', newTokens.refreshToken, {
          ...cookieOptions,
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;
      }
      return NextResponse.json({ user: null });
    }

    if (!payload) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ 
      user: {
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        role: payload.user.role,
        organizationId: payload.user.organizationId
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}