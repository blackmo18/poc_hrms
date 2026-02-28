/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Formats a Date object to YYYY-MM-DD format in local timezone
 * This avoids timezone conversion issues that can occur with toISOString()
 * 
 * @param date - The date to format
 * @returns The formatted date string in YYYY-MM-DD format
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to a more readable format (e.g., "January 1, 2024")
 * 
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatDateToReadable(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a Date object to a short readable format (e.g., "Jan 1, 2024")
 * 
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatDateToShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Creates a Date object from a YYYY-MM-DD string in local timezone
 * 
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns The Date object in local timezone
 */
export function createDateFromYYYYMMDD(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks if a date string is in YYYY-MM-DD format
 * 
 * @param dateString - The date string to validate
 * @returns True if the string is in valid YYYY-MM-DD format
 */
export function isValidYYYYMMDD(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = createDateFromYYYYMMDD(dateString);
  return !isNaN(date.getTime());
}

/**
 * Gets the start of a day (00:00:00) for a given date
 * 
 * @param date - The date
 * @returns A new Date object set to the start of the day
 */
export function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Gets the end of a day (23:59:59) for a given date
 * 
 * @param date - The date
 * @returns A new Date object set to the end of the day
 */
export function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}
