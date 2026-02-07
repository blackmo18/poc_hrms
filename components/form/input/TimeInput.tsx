'use client';

import React, { useState, useRef } from 'react';
import Input from './InputField';

interface TimeInputProps {
  value: string; // Always HH:mm (24h)
  onChange: (val: string) => void;
  format?: 12 | 24;
}

const TimeInput = ({ value, onChange, format = 24 }: TimeInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper: Convert 24h string to 12h display object
  const getDisplayState = () => {
    if (!value || value === '--:--') return { time: '--:--', period: 'AM' };
    
    if (format == 24) return { time: value, period: null };

    let [h, m] = value.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12; // Convert 0 to 12
    return { 
      time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, 
      period 
    };
  };

  const { time, period } = getDisplayState();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!/[0-9]|Backspace|Tab/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
      updateTime(e.key);
    }
  };

  const updateTime = (char: string) => {
    let digits = value.replace(/[^0-9]/g, '');
    if (digits.length >= 4) digits = digits.slice(1);
    digits += char;

    const padded = digits.padStart(4, '0');
    let h = padded.slice(0, 2);
    let m = padded.slice(2, 4);

    // Validation
    if (parseInt(h) > 23) h = '23';
    if (parseInt(m) > 59) m = '59';

    onChange(`${h}:${m}`);
  };

  const handleBackspace = () => {
    let digits = value.replace(/[^0-9]/g, '');
    digits = digits.slice(0, -1).padStart(4, '0');
    onChange(`${digits.slice(0, 2)}:${digits.slice(2, 4)}`);
  };

  const togglePeriod = () => {
    if (format === 24) return;
    let [h, m] = value.split(':').map(Number);
    // Add or subtract 12 hours to flip AM/PM
    const newH = h >= 12 ? h - 12 : h + 12;
    onChange(`${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="group relative flex items-center justify-center px-3 h-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg cursor-text focus-within:ring-2 focus-within:ring-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        <Input
          ref={inputRef}
          type="text"
          className="sr-only"
          onKeyDown={(e) => e.key === 'Backspace' ? handleBackspace() : handleKeyDown(e)}
        />
        
        <div className="font-mono text-lg tracking-widest text-gray-800 dark:text-white">
          {time}
        </div>

        {/* Status Indicator */}
        <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-400 uppercase">
          {format === 24 ? '24h' : period}
        </div>
      </div>

      { format != 24 && (
        <button
          onClick={togglePeriod}
          className="px-2 py-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          AM/PM
        </button>
      )}
    </div>
  );
};

export default TimeInput;