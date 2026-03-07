/**
 * Timezone utility functions for handling Asia/Manila timezone conversions
 * All inputs are assumed to be in Asia/Manila timezone
 * All database storage is in UTC
 */

export const MANILA_TIMEZONE = 'Asia/Manila';

/**
 * Converts a date/time string from Asia/Manila timezone to UTC Date object
 * @param manilaDateTime - Date/time in Asia/Manila timezone
 * @returns Date object in UTC
 */
export function convertManilaToUTC(manilaDateTime: Date | string): Date {
  const date = typeof manilaDateTime === 'string' ? new Date(manilaDateTime) : manilaDateTime;
  
  // Create a formatter that parses the date as Manila time
  const manilaYear = date.getFullYear();
  const manilaMonth = date.getMonth();
  const manilaDay = date.getDate();
  const manilaHours = date.getHours();
  const manilaMinutes = date.getMinutes();
  const manilaSeconds = date.getSeconds();
  const manilaMilliseconds = date.getMilliseconds();
  
  // Create a UTC date representing the same moment in Manila time
  const utcDate = new Date(Date.UTC(
    manilaYear,
    manilaMonth,
    manilaDay,
    manilaHours,
    manilaMinutes,
    manilaSeconds,
    manilaMilliseconds
  ));
  
  // Adjust for Manila timezone offset (UTC+8)
  const manilaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  return new Date(utcDate.getTime() - manilaOffset);
}

/**
 * Converts a UTC Date object to Asia/Manila timezone Date object
 * @param utcDate - Date object in UTC
 * @returns Date object representing the time in Asia/Manila timezone
 */
export function convertUTCToManila(utcDate: Date | string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Get the UTC time
  const utcTime = date.getTime();
  
  // Adjust for Manila timezone offset (UTC+8)
  const manilaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const manilaTime = utcTime + manilaOffset;
  
  return new Date(manilaTime);
}

/**
 * Gets the current time in UTC (for database storage)
 * @returns Current Date object in UTC
 */
export function getCurrentUTC(): Date {
  return new Date();
}

/**
 * Gets the current time in Asia/Manila timezone
 * @returns Date object representing current time in Manila
 */
export function getCurrentManilaTime(): Date {
  return convertUTCToManila(getCurrentUTC());
}

/**
 * Formats a UTC date for display in Asia/Manila timezone
 * @param utcDate - Date object in UTC
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Manila timezone
 */
export function formatUTCForManilaDisplay(
  utcDate: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const manilaDate = convertUTCToManila(utcDate);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  };
  
  return manilaDate.toLocaleString('en-US', defaultOptions);
}

/**
 * Formats a UTC time for display in Asia/Manila timezone (time only)
 * @param utcDate - Date object in UTC
 * @returns Formatted time string in Manila timezone
 */
export function formatUTCTimeForManilaDisplay(utcDate: Date | string): string {
  return formatUTCForManilaDisplay(utcDate, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Formats a UTC date for display in Asia/Manila timezone (date only)
 * @param utcDate - Date object in UTC
 * @returns Formatted date string in Manila timezone
 */
export function formatUTCDateForManilaDisplay(utcDate: Date | string): string {
  return formatUTCForManilaDisplay(utcDate, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Creates a Date object at midnight in Asia/Manila timezone for a given date
 * @param dateString - Date string in YYYY-MM-DD format (assumed Manila date)
 * @returns Date object in UTC representing midnight Manila time
 */
export function createManilaMidnightUTC(dateString: string): Date {
  // Parse the date as Manila date
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create UTC date representing midnight Manila time
  // Midnight Manila = 16:00 previous day UTC (UTC-8)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  
  // Adjust for Manila timezone offset (UTC+8)
  const manilaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  return new Date(utcDate.getTime() - manilaOffset);
}

/**
 * Ensures a date is in UTC for database storage
 * If input is already a Date object, assumes it's in Manila time and converts to UTC
 * @param dateInput - Date object or date string in Manila timezone
 * @returns Date object in UTC
 */
export function ensureUTCForStorage(dateInput: Date | string | undefined): Date | undefined {
  if (!dateInput) return undefined;
  
  if (dateInput instanceof Date) {
    // If it's already a Date, check if it has timezone info
    // For safety, we'll treat all Date inputs as Manila time
    return convertManilaToUTC(dateInput);
  }
  
  // If it's a string, parse it as Manila time
  return convertManilaToUTC(dateInput);
}

/**
 * Converts a UTC date to ISO string in Manila timezone
 * @param utcDate - Date object in UTC
 * @returns ISO string representing the time in Manila timezone
 */
export function convertUTCToManilaISO(utcDate: Date | string | null | undefined): string | null {
  if (!utcDate) return null;
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const manilaDate = convertUTCToManila(date);
  return manilaDate.toISOString();
}

/**
 * Converts a UTC date to ISO string for date-only in Manila timezone
 * @param utcDate - Date object in UTC
 * @returns ISO string representing the date in Manila timezone (YYYY-MM-DD)
 */
export function convertUTCToManilaDateISO(utcDate: Date | string | null | undefined): string | null {
  if (!utcDate) return null;
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const manilaDate = convertUTCToManila(date);
  return manilaDate.toISOString().split('T')[0];
}

/**
 * Validates if a string is a valid ISO date format
 * @param dateString - The date string to validate
 * @returns true if valid ISO date, false otherwise
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}/) !== null;
}
