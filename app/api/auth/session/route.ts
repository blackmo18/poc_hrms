import { auth, Session } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await (await import('next/headers')).cookies();
    const session: Session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieStore.toString()
      })
    });

    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ 
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.roles?.[0] || 'EMPLOYEE', // Use roles from session
        roles: session.user.roles || [],
        permissions: session.user.permissions || []
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}