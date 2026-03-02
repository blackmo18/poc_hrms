'use client';

import { ThemeProvider } from '../../context/ThemeContext';
import { SerwistProvider } from '@serwist/turbopack/react';
import { AuthProvider } from './auth-provider';
import { RoleAccessProvider } from './role-access-provider';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';
import IdleStatus from '../../components/common/IdleStatus';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <ThemeProvider>
        <AuthProvider>
          <RoleAccessProvider>
            {children}
            <PWAInstallPrompt />
            <IdleStatus />
          </RoleAccessProvider>
        </AuthProvider>
      </ThemeProvider>
    </SerwistProvider>
  );
}
