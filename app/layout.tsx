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
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
  },
  manifest: '/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HR Management System',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'HR Management System',
    title: 'HR Management System',
    description: 'A comprehensive HR management system',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'HR Management System',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'HR Management System',
    description: 'A comprehensive HR management system',
    images: ['/icons/icon-512x512.png'],
  },
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HR Management System" />
        <meta name="application-name" content="HR Management System" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
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
