import { useEffect, useRef, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  permissions?: string[];
}

interface UseIdleTimeoutOptions {
  timeout?: number; // in milliseconds
  promptBefore?: number; // prompt user before auto logout (in milliseconds)
  enabled?: boolean;
}

export function useIdleTimeout(
  logout: () => Promise<void>,
  user: User | null,
  options: UseIdleTimeoutOptions = {}
) {
  const { 
    timeout = 30 * 60 * 1000, // 30 minutes default
    promptBefore = 5 * 60 * 1000, // 5 minutes before timeout
    enabled = true
  } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promptRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (promptRef.current) {
      clearTimeout(promptRef.current);
    }

    if (!enabled || !user) return;

    // Set prompt timer
    promptRef.current = setTimeout(() => {
      // Show warning to user
      const shouldContinue = window.confirm(
        `You will be automatically logged out in ${Math.round(promptBefore / 60000)} minutes due to inactivity. Click OK to stay logged in.`
      );

      if (shouldContinue) {
        resetTimer();
      } else {
        logout();
      }
    }, timeout - promptBefore);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      console.log('Auto-logout due to inactivity');
      logout();
    }, timeout);
  }, [enabled, user, timeout, promptBefore, logout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled || !user) {
      // Clear timers if disabled or no user
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (promptRef.current) clearTimeout(promptRef.current);
      return;
    }

    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (promptRef.current) clearTimeout(promptRef.current);
    };
  }, [enabled, user, handleActivity, resetTimer]);

  // Return current idle status for debugging/monitoring
  const getIdleStatus = useCallback(() => {
    if (!enabled || !user) return null;

    const now = Date.now();
    const idleTime = now - lastActivityRef.current;
    const timeUntilPrompt = timeout - promptBefore - idleTime;
    const timeUntilLogout = timeout - idleTime;

    return {
      isIdle: idleTime > 0,
      idleTime,
      timeUntilPrompt: Math.max(0, timeUntilPrompt),
      timeUntilLogout: Math.max(0, timeUntilLogout),
      willPrompt: timeUntilPrompt <= 0 && timeUntilLogout > 0,
      willLogout: timeUntilLogout <= 0
    };
  }, [timeout, promptBefore, enabled, user]);

  return {
    getIdleStatus,
    resetTimer
  };
}
