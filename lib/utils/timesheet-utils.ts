/**
 * Utility functions for timesheet calculations and payroll cutoff periods
 */

/**
 * Get the start and end dates for a monthly cutoff period
 * @param referenceDate - Any date within the desired period
 * @param cutoffDay - The day of the month when payroll is cut off (e.g., 15 for mid-month, 31 for end-of-month)
 */
export function getMonthlyCutoffPeriod(referenceDate: Date, cutoffDay: number): { startDate: Date; endDate: Date } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let startDate: Date;
  let endDate: Date;

  if (cutoffDay === 15) {
    // Mid-month cutoff (1st-15th)
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month, 15, 23, 59, 59, 999);
  } else if (cutoffDay === 31 || cutoffDay === new Date(year, month + 1, 0).getDate()) {
    // End-of-month cutoff (16th-end of month)
    startDate = new Date(year, month, 16);
    endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  } else {
    // Custom cutoff day
    if (referenceDate.getDate() <= cutoffDay) {
      // We're in the first half of the month
      startDate = new Date(year, month - 1, cutoffDay + 1);
      endDate = new Date(year, month, cutoffDay, 23, 59, 59, 999);
    } else {
      // We're in the second half of the month
      startDate = new Date(year, month, cutoffDay + 1);
      endDate = new Date(year, month + 1, cutoffDay, 23, 59, 59, 999);
    }
  }

  return { startDate, endDate };
}

/**
 * Get the start and end dates for a bi-weekly cutoff period
 * @param referenceDate - Any date within the desired period
 * @param weekStartDay - Day of week that starts the pay period (0 = Sunday, 1 = Monday, etc.)
 */
export function getBiWeeklyCutoffPeriod(referenceDate: Date, weekStartDay: number = 1): { startDate: Date; endDate: Date } {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay();

  // Calculate days to go back to reach the week start
  const daysToSubtract = (dayOfWeek - weekStartDay + 7) % 7;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  // Bi-weekly period is 14 days
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 13);
  weekEnd.setHours(23, 59, 59, 999);

  return { startDate: weekStart, endDate: weekEnd };
}

/**
 * Get the start and end dates for a weekly cutoff period
 * @param referenceDate - Any date within the desired period
 * @param weekStartDay - Day of week that starts the pay period (0 = Sunday, 1 = Monday, etc.)
 */
export function getWeeklyCutoffPeriod(referenceDate: Date, weekStartDay: number = 1): { startDate: Date; endDate: Date } {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay();

  // Calculate days to go back to reach the week start
  const daysToSubtract = (dayOfWeek - weekStartDay + 7) % 7;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  // Weekly period is 7 days
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { startDate: weekStart, endDate: weekEnd };
}

/**
 * Calculate the number of minutes between two dates
 */
export function calculateMinutesDifference(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

/**
 * Convert minutes to hours and minutes format
 */
export function formatMinutesToHours(minutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return { hours, minutes: remainingMinutes };
}

/**
 * Format minutes as a decimal hours string (e.g., 90 minutes = "1.50")
 */
export function formatMinutesAsDecimalHours(minutes: number): string {
  const decimalHours = (minutes / 60).toFixed(2);
  return decimalHours;
}

/**
 * Check if a date falls within a given date range (inclusive)
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Get all dates within a date range
 */
export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
