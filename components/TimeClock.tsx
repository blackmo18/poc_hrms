'use client'

import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, History, Calendar } from 'lucide-react';
import Alert from './ui/alert/Alert';
import { Button } from './ui/button';
import { useTimeClock } from '../hooks/useTimeClock';

interface TimeClockProps {
  showHeader?: boolean;
  className?: string;
}

const TimeClock: React.FC<TimeClockProps> = ({
  showHeader = true,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    isClockedIn,
    isOnBreak,
    workingTime,
    logs,
    clockIn,
    clockOut,
    toggleBreak,
    formatElapsedTime,
  } = useTimeClock();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`max-w-md mx-auto bg-gray-50 dark:bg-gray-900 min-h-[500px] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {showHeader && (
        <>
          {/* Header Section */}
          <div className="bg-blue-600 p-8 text-white text-center">
            <p className="text-blue-100 text-sm font-medium uppercase tracking-widest mb-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-5xl font-mono font-bold tracking-tighter">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </h1>
          </div>
        </>
      )}

      <div className="p-6 -mt-6 bg-white dark:bg-gray-800 rounded-t-2xl">
        {/* Status Display using Alert */}
        <div className="mb-6">
          {isClockedIn ? (
            isOnBreak ? (
              <Alert
                variant="warning"
                title="On Break"
                message="You are currently taking a break. Resume work when ready."
              />
            ) : (
              <Alert
                variant="success"
                title="Clocked In"
                message="You are currently working. Remember to take breaks as needed."
              />
            )
          ) : (
            <Alert
              variant="info"
              title="Clocked Out"
              message="You are currently offline. Clock in to start your work session."
            />
          )}
        </div>

        {/* Working Timer - Show when clocked in */}
        {isClockedIn && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isOnBreak
              ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
              : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm uppercase font-semibold tracking-wide ${
                  isOnBreak ? 'text-orange-600 dark:text-orange-300' : 'text-blue-600 dark:text-blue-300'
                }`}>
                  {isOnBreak ? 'Break Time' : 'Working Time'}
                </p>
                <p className={`text-2xl font-mono font-bold mt-1 ${
                  isOnBreak ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {formatElapsedTime(workingTime)}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isOnBreak ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Clock className={isOnBreak ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'} size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <Button
          onClick={isClockedIn ? clockOut : clockIn}
          variant={isClockedIn ? "destructive" : "default"}
          size="lg"
          className={`w-full text-lg font-semibold ${
            isClockedIn
            ? 'bg-zinc-500 hover:bg-zinc-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isClockedIn ? (
            <><Square size={20} className="mr-2" /> Clock Out</>
          ) : (
            <><Play size={20} className="mr-2" /> Clock In</>
          )}
        </Button>

        {/* Break Button - Only show when clocked in */}
        {isClockedIn && (
          <Button
            onClick={toggleBreak}
            variant={isOnBreak ? "default" : "secondary"}
            size="lg"
            className={`w-full mt-3 text-lg font-semibold ${
              isOnBreak
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isOnBreak ? (
              <><Play size={20} className="mr-2" /> Resume Work</>
            ) : (
              <><Square size={20} className="mr-2" /> Take Break</>
            )}
          </Button>
        )}

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <History size={18} />
            <h3 className="font-bold">Today's Logs</h3>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">No activity recorded yet.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    log.type === 'Clock In'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : log.type === 'Clock Out'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : log.type === 'Break Start'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      : log.type === 'Break End'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : log.type === 'Session Summary'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {log.type}
                  </span>
                  <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeClock;
