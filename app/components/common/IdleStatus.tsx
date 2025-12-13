'use client';

import { useIdleTimeout } from '@/hooks/useIdleTimeout';

export default function IdleStatus() {
  const { getIdleStatus } = useIdleTimeout();

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
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Idle Status:</div>
      <div>Idle Time: {formatTime(status.idleTime)}</div>
      <div>Until Prompt: {formatTime(status.timeUntilPrompt)}</div>
      <div>Until Logout: {formatTime(status.timeUntilLogout)}</div>
      <div className={status.willPrompt ? 'text-yellow-400' : status.willLogout ? 'text-red-400' : 'text-green-400'}>
        Status: {status.willLogout ? 'LOGGING OUT' : status.willPrompt ? 'WARNING' : 'ACTIVE'}
      </div>
    </div>
  );
}
