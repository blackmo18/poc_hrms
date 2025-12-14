'use client';

import { useEffect, useState } from 'react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useAuth } from '../providers/auth-provider';

export default function IdleStatus() {
  const { user, logout } = useAuth();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const { getIdleStatus } = useIdleTimeout(logout, user, {
    timeout: 12 * 60 * 1000, // 12 minutes
    promptBefore: 2 * 60 * 1000, // 2 minutes
    enabled: !!user // Only enable when user is logged in
  });

  // Update every second to show live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const status = getIdleStatus();

  if (!status) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="hidden lg:fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 border border-gray-600">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${updateTrigger % 2 === 0 ? 'bg-green-400' : 'bg-blue-400'} transition-colors duration-100`}></div>
        <div>Idle Status (Live)</div>
      </div>
      <div>Idle Time: {formatTime(status.idleTime)}</div>
      <div>Until Prompt: {formatTime(status.timeUntilPrompt)}</div>
      <div>Until Logout: {formatTime(status.timeUntilLogout)}</div>
      <div className={status.willPrompt ? 'text-yellow-400' : status.willLogout ? 'text-red-400' : 'text-green-400'}>
        Status: {status.willLogout ? 'LOGGING OUT' : status.willPrompt ? 'WARNING' : 'ACTIVE'}
      </div>
    </div>
  );
}
