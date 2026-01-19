import { useState, useEffect, useCallback, useMemo } from 'react';

// API service functions
const timesheetApi = {
  async performAction(type: 'clockin' | 'clockout' | 'breakin' | 'breakout') {
    const response = await fetch('/api/timesheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
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
  // Initialize state with defaults
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [workTime, setWorkTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [logs, setLogs] = useState<ClockLog[]>([]);
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial status from API
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await timesheetApi.getStatus();
      
      setIsClockedIn(status.isClockedIn);
      setIsOnBreak(status.isOnBreak);
      setActiveEntry(status.activeEntry);
      setActiveBreak(status.activeBreak);
      setTodayEntries(status.todayEntries || []);
      
      // Set start time if there's an active entry
      if (status.activeEntry?.clock_in_at) {
        setStartTime(new Date(status.activeEntry.clock_in_at));
      }
      
      // Set break start time if there's an active break
      if (status.activeBreak?.break_start_at) {
        setBreakStartTime(new Date(status.activeBreak.break_start_at));
      }
      
      if (status.activeEntry) {
        const now = new Date();
        const totalElapsed = Math.floor((now.getTime() - new Date(status.activeEntry.clock_in_at).getTime()) / 1000);
        setTotalTime(totalElapsed);
        
        // Calculate work time by subtracting break time
        let breakTimeSeconds = 0;
        if (status.todayEntries) {
          status.todayEntries.forEach((entry: any) => {
            if (entry.timeBreaks) {
              entry.timeBreaks.forEach((breakItem: any) => {
                if (breakItem.break_start_at && breakItem.break_end_at) {
                  const breakDuration = Math.floor(
                    (new Date(breakItem.break_end_at).getTime() - new Date(breakItem.break_start_at).getTime()) / 1000
                  );
                  breakTimeSeconds += breakDuration;
                }
              });
            }
          });
        }
        
        // Add current break duration if on break
        if (status.isOnBreak && status.activeBreak?.break_start_at) {
          const currentBreakElapsed = Math.floor(
            (now.getTime() - new Date(status.activeBreak.break_start_at).getTime()) / 1000
          );
          breakTimeSeconds += currentBreakElapsed;
        }
        
        setWorkTime(totalElapsed - breakTimeSeconds);
        setBreakTime(breakTimeSeconds);
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

  // Initialize on mount
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

  // Calculate current break duration (only when actively on break)
  const currentBreakDuration = useMemo(() => {
    if (!isOnBreak || !breakStartTime) return 0;
    // Calculate break duration in seconds, ignoring milliseconds
    return Math.floor((new Date().getTime() - breakStartTime.getTime()) / 1000);
  }, [isOnBreak, breakStartTime]);
  
  // Total break time = accumulated break time + current break duration
  const totalBreakTime = useMemo(() => {
    return breakTime + currentBreakDuration;
  }, [breakTime, currentBreakDuration]);
  
  // Calculate working time = workTime state (already excludes break time)
  const workingTime = useMemo(() => {
    return workTime;
  }, [workTime]);


  // Update total time and work time - use 1-second intervals for precise second counting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isClockedIn && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        
        // Calculate elapsed time in seconds (ignore milliseconds)
        const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTotalTime(totalElapsed);
        
        // Only update work time when not on break
        if (!isOnBreak) {
          setWorkTime(totalElapsed - breakTime);
        }
      }, 1000); // Update every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, startTime, isOnBreak, breakTime]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Clock in handler
  const clockIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await timesheetApi.performAction('clockin');
      
      // Refresh status after successful clock in
      // Add small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchStatus();
      
      // Add local log for UI
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => [{
        type: 'Clock In',
        time: timestamp,
        date: now.toLocaleDateString()
      }, ...prev]);

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('timeClock:clockIn'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Clock in failed';
      setError(errorMessage);
      console.error('Clock in error:', err);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('timeClock:error', {
        detail: { action: 'clockIn', reason: errorMessage }
      }));
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  // Clock out handler
  const clockOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await timesheetApi.performAction('clockout');
      
      // Get work session summary before refreshing
      const workHours = Math.floor(workTime / 3600);
      const workMinutes = Math.floor((workTime % 3600) / 60);
      const workSeconds = workTime % 60;
      
      const totalBreakHours = Math.floor(totalBreakTime / 3600);
      const totalBreakMinutes = Math.floor((totalBreakTime % 3600) / 60);
      const totalBreakSeconds = totalBreakTime % 60;
      
      const workTimeText = `Work: ${workHours.toString().padStart(2, '0')}:${workMinutes.toString().padStart(2, '0')}:${workSeconds.toString().padStart(2, '0')}`;
      const breakTimeText = `Break: ${totalBreakHours.toString().padStart(2, '0')}:${totalBreakMinutes.toString().padStart(2, '0')}:${totalBreakSeconds.toString().padStart(2, '0')}`;
      const summaryText = `${workTimeText} | ${breakTimeText}`;
      
      // Add session summary and clock out logs
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => [
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
      ]);
      
      // Refresh status after successful clock out
      // Add small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchStatus();

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('timeClock:clockOut'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Clock out failed';
      setError(errorMessage);
      console.error('Clock out error:', err);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('timeClock:error', {
        detail: { action: 'clockOut', reason: errorMessage }
      }));
    } finally {
      setLoading(false);
    }
  }, [workTime, totalBreakTime, fetchStatus]);

  // Break toggle handler
  const toggleBreak = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const action = isOnBreak ? 'breakout' : 'breakin';
      await timesheetApi.performAction(action);
      
      // Add local log for UI
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => [{
        type: isOnBreak ? 'Break End' : 'Break Start',
        time: timestamp,
        date: now.toLocaleDateString()
      }, ...prev]);
      
      // Refresh status after successful break toggle
      // Add small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchStatus();

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('timeClock:breakToggle', {
        detail: { isOnBreak: !isOnBreak }
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Break toggle failed';
      setError(errorMessage);
      console.error('Break toggle error:', err);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('timeClock:error', {
        detail: { action: 'break', reason: errorMessage }
      }));
    } finally {
      setLoading(false);
    }
  }, [isOnBreak, fetchStatus]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Format today's entries for display
  const formattedEntries = useMemo(() => {
    if (!todayEntries || todayEntries.length === 0) return [];
    
    // Helper function to format time
    const formatTime = (date: Date) => 
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Helper function to format break
    const formatBreak = (breakItem: any) => ({
      id: breakItem.id,
      type: breakItem.break_start_at && !breakItem.break_end_at ? 'Break Start' : 'Break',
      startTime: breakItem.break_start_at ? formatTime(new Date(breakItem.break_start_at)) : null,
      endTime: breakItem.break_end_at ? formatTime(new Date(breakItem.break_end_at)) : null,
      duration: breakItem.break_start_at && breakItem.break_end_at 
        ? formatTime(new Date(breakItem.break_end_at))
        : null,
    });
    
    // Helper function to get sort timestamp
    const getSortTimestamp = (entry: any) => 
      entry.clock_out_at 
        ? new Date(entry.clock_out_at).getTime()
        : new Date(entry.clock_in_at).getTime();
    
    // Sort entries by most recent activity
    const sortedEntries = [...todayEntries].sort((a, b) => 
      getSortTimestamp(b) - getSortTimestamp(a)
    );
    
    // Map to formatted entries
    return sortedEntries.map((entry: any) => ({
      id: entry.id,
      clockInTime: formatTime(new Date(entry.clock_in_at)),
      clockOutTime: entry.clock_out_at ? formatTime(new Date(entry.clock_out_at)) : null,
      totalWorkMinutes: entry.total_work_minutes || null, // Only for completed entries
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
