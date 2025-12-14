import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { AuthProvider } from './components/providers/auth-provider';
import { ThemeProvider } from './context/ThemeContext';
import IdleStatus from './components/common/IdleStatus';
import { JWTUtils } from '@/lib/auth/jwt';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HR Management System',
  description: 'A comprehensive HR management system',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const themeCookie = cookieStore.get('theme')?.value;
  const initialTheme = (themeCookie === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

  let initialUser = null;

  if (accessToken) {
    const payload = JWTUtils.decodeToken(accessToken);
    if (payload) {
      initialUser = {
        id: payload.userId.toString(),
        email: payload.email,
        username: payload.username,
      };
    }
  }

  return (
    <html lang="en" suppressHydrationWarning className={initialTheme === 'dark' ? 'dark' : ''}>
      <body className={inter.className}>
        <ThemeProvider initialTheme={initialTheme}>
          <AuthProvider initialUser={initialUser}>
            {children}
            <IdleStatus />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
