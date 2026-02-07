import './globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AuthProvider } from '../components/providers/auth-provider';
import { RoleAccessProvider } from '../components/providers/role-access-provider';
import { ThemeProvider } from '../context/ThemeContext';
import IdleStatus from '../components/common/IdleStatus';

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
  const themeCookie = cookieStore.get('theme')?.value;
  const initialTheme = (themeCookie === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

  return (
    <html lang="en" suppressHydrationWarning className={initialTheme === 'dark' ? 'dark' : ''}>
      <body>
        <ThemeProvider initialTheme={initialTheme}>
          <AuthProvider>
            <RoleAccessProvider>
              {children}
              <IdleStatus />
            </RoleAccessProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
