import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// API service functions
const timesheetApi = {
  async performAction(type: 'clockin' | 'clockout' | 'breakin' | 'breakout', payload?: any) {
    const body: any = { type };
    
    // For clock-in, include workDate (client knows local timezone)
    if (type === 'clockin' && payload?.workDate) {
      body.workDate = payload.workDate;
    }
    
    const response = await fetch('/api/timesheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return response.json();
  },
  
  async getStatus() {
    const response = await fetch('/api/timesheet');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch status');
    }
    
    return response.json();
  }
};

export interface ClockLog {
  type: string;
  time: string;
  date: string;
  checksum?: string;
}

export interface TimeClockState {
  isClockedIn: boolean;
  isOnBreak: boolean;
  startTime: Date | null;
  breakStartTime: Date | null;
  totalTime: number;
  workTime: number;
  breakTime: number;
  logs: ClockLog[];
  activeEntry?: any;
  activeBreak?: any;
  todayEntries?: any[];
}


export const useTimeClock = () => {
  // Helper function to load logs from localStorage
  const loadLogsFromStorage = (): ClockLog[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('timeClock_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
      return [];
    }
  };

  // Helper function to save logs to localStorage
  const saveLogsToStorage = (logsToSave: ClockLog[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('timeClock_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  };

  // Initialize state with defaults
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [workTime, setWorkTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [logs, setLogs] = useState<ClockLog[]>(loadLogsFromStorage());
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track accumulated break time for interval calculations
  const accumulatedBreakTimeRef = useRef(0);
  // Use ref to track clocked in status for interval checks
  const isClockedInRef = useRef(false);
  // Use ref to track start time for interval checks (avoid stale closure)
  const startTimeRef = useRef<Date | null>(null);

  // Validate and sync logs with API response
  const validateLogsAgainstAPI = useCallback((apiResponse: any) => {
    const hasEntries = apiResponse.todayEntries && apiResponse.todayEntries.length > 0;
    const hasActiveEntry = apiResponse.activeEntry;

    // Clear logs if no entries and no active entry (data was deleted)
    if (!hasEntries && !hasActiveEntry) {
      setLogs([]);
      saveLogsToStorage([]);
      return;
    }

    // Clear logs if active entry doesn't exist in entries (entry was deleted)
    if (hasActiveEntry && !apiResponse.todayEntries.some((entry: any) => entry.id === apiResponse.activeEntry.id)) {
      setLogs([]);
      saveLogsToStorage([]);
    }
  }, []);

  // Fetch initial status from API
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await timesheetApi.getStatus();
      
      // Validate logs against API response
      validateLogsAgainstAPI(status);
      
      // Update ref to track clocked in status for interval checks
      isClockedInRef.current = status.isClockedIn;
      
      setIsClockedIn(status.isClockedIn);
      setIsOnBreak(status.isOnBreak);
      setActiveEntry(status.activeEntry);
      setActiveBreak(status.activeBreak);
      setTodayEntries(status.todayEntries || []);
      
      // Set start time if there's an active entry
      if (status.activeEntry?.clockInAt) {
        const newStartTime = new Date(status.activeEntry.clockInAt);
        setStartTime(newStartTime);
        startTimeRef.current = newStartTime;
      } else {
        setStartTime(null);
        startTimeRef.current = null;
      }
      
      // Set break start time if there's an active break
      if (status.activeBreak?.breakStartAt) {
        setBreakStartTime(new Date(status.activeBreak.breakStartAt));
      } else {
        // Clear break start time if no active break
        setBreakStartTime(null);
      }
      
      if (status.activeEntry) {
        const clockInDate = new Date(status.activeEntry.clockInAt);
        
        // Validate clock in date
        if (isNaN(clockInDate.getTime())) {
          console.error('Invalid clockInAt date:', status.activeEntry.clockInAt);
          setTotalTime(0);
          setWorkTime(0);
          setBreakTime(0);
          return;
        }
        
        // If entry has clockOutAt, use it; otherwise use current time
        let endTime: Date;
        if (status.activeEntry.clockOutAt) {
          endTime = new Date(status.activeEntry.clockOutAt);
          if (isNaN(endTime.getTime())) {
            endTime = new Date();
          }
        } else {
          // Round current time to nearest second (remove milliseconds)
          const now = new Date();
          const currentSeconds = Math.floor(now.getTime() / 1000) * 1000;
          endTime = new Date(currentSeconds);
        }
        
        // Calculate elapsed time in seconds (second precision)
        const totalElapsed = Math.floor((endTime.getTime() - clockInDate.getTime()) / 1000);
        setTotalTime(Math.max(0, totalElapsed)); // Ensure non-negative
        
        // Calculate work time by subtracting break time
        let breakTimeSeconds = 0;
        if (status.activeEntry && status.activeEntry.timeBreaks) {
          status.activeEntry.timeBreaks.forEach((breakItem: any) => {
            if (breakItem.breakStartAt && breakItem.breakEndAt) {
              const breakStartDate = new Date(breakItem.breakStartAt);
              const breakEndDate = new Date(breakItem.breakEndAt);
              
              if (!isNaN(breakStartDate.getTime()) && !isNaN(breakEndDate.getTime())) {
                const breakDuration = Math.floor(
                  (breakEndDate.getTime() - breakStartDate.getTime()) / 1000
                );
                if (breakDuration > 0) {
                  breakTimeSeconds += breakDuration;
                }
              }
            }
          });
        }
        
        // Add current break duration if on break
        if (status.isOnBreak && status.activeBreak?.breakStartAt) {
          const breakStartDate = new Date(status.activeBreak.breakStartAt);
          if (!isNaN(breakStartDate.getTime())) {
            const currentBreakElapsed = Math.floor(
              (new Date().getTime() - breakStartDate.getTime()) / 1000
            );
            if (currentBreakElapsed > 0) {
              breakTimeSeconds += currentBreakElapsed;
            }
          }
        }
        
        const workTimeValue = Math.max(0, totalElapsed - breakTimeSeconds);
        setWorkTime(workTimeValue);
        setBreakTime(Math.max(0, breakTimeSeconds));
        // Update ref for interval calculations
        accumulatedBreakTimeRef.current = Math.max(0, breakTimeSeconds);
      } else {
        // Reset times when no active entry
        setTotalTime(0);
        setWorkTime(0);
        setBreakTime(0);
        setStartTime(null);
        setBreakStartTime(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      console.error('Fetch status error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchStatus();
      } catch (error) {
        console.error('Failed to initialize time clock status:', error);
        setError('Failed to load timesheet data');
      }
    };
    
    initialize();
  }, [fetchStatus]);

  const currentBreakDuration = useMemo(() => {
    if (!isOnBreak || !breakStartTime) return 0;
    return Math.floor((new Date().getTime() - breakStartTime.getTime()) / 1000);
  }, [isOnBreak, breakStartTime]);
  
  const totalBreakTime = useMemo(() => {
    return breakTime + currentBreakDuration;
  }, [breakTime, currentBreakDuration]);
  
  const workingTime = useMemo(() => {
    return workTime;
  }, [workTime]);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isClockedIn && startTime && !isOnBreak && isClockedInRef.current) {
      interval = setInterval(() => {
        if (!isClockedInRef.current || !startTimeRef.current) {
          clearInterval(interval);
          return;
        }
        
        const now = new Date();
        const currentSeconds = Math.floor(now.getTime() / 1000) * 1000;
        const nowRounded = new Date(currentSeconds);
        
        const totalElapsed = Math.floor((nowRounded.getTime() - startTimeRef.current.getTime()) / 1000);
        setTotalTime(totalElapsed);
        
        const accumulatedBreakTime = accumulatedBreakTimeRef.current;
        const calculatedWorkTime = Math.max(0, totalElapsed - accumulatedBreakTime);
        setWorkTime(calculatedWorkTime);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, startTime, isOnBreak]);

  const formatElapsedTime = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00:00';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const clockIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Send workDate to server (client knows local timezone)
      const today = new Date();
      const workDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      await timesheetApi.performAction('clockin', { workDate });
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchStatus();
      
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => {
        const newLogs = [{
          type: 'Clock In',
          time: timestamp,
          date: now.toLocaleDateString()
        }, ...prev];
        saveLogsToStorage(newLogs);
        return newLogs;
      });

      window.dispatchEvent(new CustomEvent('timeClock:clockIn'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Clock in failed';
      setError(errorMessage);
      console.error('Clock in error:', err);
      window.dispatchEvent(new CustomEvent('timeClock:error', {
        detail: { action: 'clockIn', reason: errorMessage }
      }));
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const clockOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentWorkTime = workTime;
      const currentTotalBreakTime = totalBreakTime;
      
      await timesheetApi.performAction('clockout');
      
      const workHours = Math.floor(currentWorkTime / 3600);
      const workMinutes = Math.floor((currentWorkTime % 3600) / 60);
      const workSeconds = Math.floor(currentWorkTime % 60);
      
      const totalBreakHours = Math.floor(currentTotalBreakTime / 3600);
      const totalBreakMinutes = Math.floor((currentTotalBreakTime % 3600) / 60);
      const totalBreakSeconds = Math.floor(currentTotalBreakTime % 60);
      
      const workTimeText = `Work: ${workHours.toString().padStart(2, '0')}:${workMinutes.toString().padStart(2, '0')}:${workSeconds.toString().padStart(2, '0')}`;
      const breakTimeText = `Break: ${totalBreakHours.toString().padStart(2, '0')}:${totalBreakMinutes.toString().padStart(2, '0')}:${totalBreakSeconds.toString().padStart(2, '0')}`;
      const summaryText = `${workTimeText} | ${breakTimeText}`;
      
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => {
        const newLogs = [
          {
            type: 'Session Summary',
            time: summaryText,
            date: now.toLocaleDateString()
          },
          {
            type: 'Clock Out',
            time: timestamp,
            date: now.toLocaleDateString()
          },
          ...prev
        ];
        saveLogsToStorage(newLogs);
        return newLogs;
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchStatus();

      window.dispatchEvent(new CustomEvent('timeClock:clockOut'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Clock out failed';
      setError(errorMessage);
      console.error('Clock out error:', err);
      window.dispatchEvent(new CustomEvent('timeClock:error', {
        detail: { action: 'clockOut', reason: errorMessage }
      }));
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  }, [workTime, totalBreakTime, fetchStatus]);

  const toggleBreak = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const action = isOnBreak ? 'breakout' : 'breakin';
      await timesheetApi.performAction(action);
      
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => {
        const newLogs = [{
          type: isOnBreak ? 'Break End' : 'Break Start',
          time: timestamp,
          date: now.toLocaleDateString()
        }, ...prev];
        saveLogsToStorage(newLogs);
        return newLogs;
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchStatus();

      window.dispatchEvent(new CustomEvent('timeClock:breakToggle', {
        detail: { isOnBreak: !isOnBreak }
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Break toggle failed';
      setError(errorMessage);
      console.error('Break toggle error:', err);
      window.dispatchEvent(new CustomEvent('timeClock:error', {
        detail: { action: 'break', reason: errorMessage }
      }));
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  }, [isOnBreak, fetchStatus]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    saveLogsToStorage([]);
  }, []);

  const formattedEntries = useMemo(() => {
    if (!todayEntries || todayEntries.length === 0) return [];
    
    const formatTime = (date: Date) => 
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const formatBreak = (breakItem: any) => ({
      id: breakItem.id,
      type: breakItem.breakStartAt && !breakItem.breakEndAt ? 'Break Start' : 'Break',
      startTime: breakItem.breakStartAt ? formatTime(new Date(breakItem.breakStartAt)) : null,
      endTime: breakItem.breakEndAt ? formatTime(new Date(breakItem.breakEndAt)) : null,
      duration: breakItem.breakStartAt && breakItem.breakEndAt 
        ? formatTime(new Date(breakItem.breakEndAt))
        : null,
    });
    
    const getSortTimestamp = (entry: any) => 
      entry.clockOutAt 
        ? new Date(entry.clockOutAt).getTime()
        : new Date(entry.clockInAt).getTime();
    
    const sortedEntries = [...todayEntries].sort((a, b) => 
      getSortTimestamp(b) - getSortTimestamp(a)
    );
    
    return sortedEntries.map((entry: any) => ({
      id: entry.id,
      clockInTime: formatTime(new Date(entry.clockInAt)),
      clockOutTime: entry.clockOutAt ? formatTime(new Date(entry.clockOutAt)) : null,
      totalWorkMinutes: entry.totalWorkMinutes || null,
      breaks: entry.timeBreaks?.map(formatBreak) || [],
    }));
  }, [todayEntries]);

  return {
    // State
    isClockedIn,
    isOnBreak,
    workingTime,
    totalTime,
    breakTime,
    logs,
    activeEntry,
    activeBreak,
    todayEntries,
    formattedEntries,
    loading,
    error,

    // Actions
    clockIn,
    clockOut,
    toggleBreak,
    clearLogs,
    fetchStatus,

    // Utilities
    formatElapsedTime,
  };
};
