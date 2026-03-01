import { describe, it, expect } from 'vitest';
import {
  createDateAtMidnightUTC,
  createDateAtMidnightUTCFromDate,
  formatUTCDateToReadable,
  formatUTCDateToYYYYMMDD,
  formatDateToYYYYMMDD,
  createDateFromYYYYMMDD,
  countWeekdaysInPeriod,
  getWeekdaysInPeriod,
  isWeekday,
  isWeekend,
  isDateInRange,
} from '../date-utils';

describe('Date Utils - UTC Midnight Functions', () => {
  describe('createDateAtMidnightUTC', () => {
    it('should create date at midnight UTC from YYYY-MM-DD string', () => {
      // Arrange
      const dateString = '2026-02-28';

      // Act
      const result = createDateAtMidnightUTC(dateString);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(result.getUTCDate()).toBe(28);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });

    it('should handle leap year dates', () => {
      // Arrange
      const dateString = '2024-02-29'; // Leap year

      // Act
      const result = createDateAtMidnightUTC(dateString);

      // Assert
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(29);
    });

    it('should handle year boundaries', () => {
      // Arrange
      const dateString = '2026-01-01';

      // Act
      const result = createDateAtMidnightUTC(dateString);

      // Assert
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(0);
      expect(result.getUTCDate()).toBe(1);
    });

    it('should handle end of year dates', () => {
      // Arrange
      const dateString = '2026-12-31';

      // Act
      const result = createDateAtMidnightUTC(dateString);

      // Assert
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(11); // December
      expect(result.getUTCDate()).toBe(31);
    });
  });

  describe('createDateAtMidnightUTCFromDate', () => {
    it('should convert any Date object to midnight UTC', () => {
      // Arrange
      const originalDate = new Date('2026-02-28T15:30:45.123Z'); // Random time

      // Act
      const result = createDateAtMidnightUTCFromDate(originalDate);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(1);
      expect(result.getUTCDate()).toBe(28);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });

    it('should preserve the date but ignore time component', () => {
      // Arrange - Create dates that represent the same calendar day but different times
      const morningDate = new Date(Date.UTC(2026, 5, 15, 8, 0, 0)); // June 15, 2026 08:00 UTC
      const eveningDate = new Date(Date.UTC(2026, 5, 15, 23, 59, 59)); // June 15, 2026 23:59 UTC

      // Act
      const morningResult = createDateAtMidnightUTCFromDate(morningDate);
      const eveningResult = createDateAtMidnightUTCFromDate(eveningDate);

      // Assert
      expect(morningResult.getTime()).toBe(eveningResult.getTime()); // Should be same
      expect(morningResult.getUTCDate()).toBe(15);
      expect(morningResult.getUTCMonth()).toBe(5); // June
      expect(morningResult.getUTCHours()).toBe(0);
      expect(morningResult.getUTCFullYear()).toBe(2026);
    });
  });

  describe('formatUTCDateToReadable', () => {
    it('should format UTC date string to readable format', () => {
      // Arrange
      const dateString = '2026-02-28T00:00:00.000Z';

      // Act
      const result = formatUTCDateToReadable(dateString);

      // Assert
      expect(result).toBe('Feb 28, 2026');
    });

    it('should handle different UTC dates correctly', () => {
      // Test various dates
      expect(formatUTCDateToReadable('2026-01-01T00:00:00.000Z')).toBe('Jan 1, 2026');
      expect(formatUTCDateToReadable('2026-12-25T00:00:00.000Z')).toBe('Dec 25, 2026');
      expect(formatUTCDateToReadable('2024-02-29T00:00:00.000Z')).toBe('Feb 29, 2024');
    });

    it('should not be affected by local timezone', () => {
      // Arrange
      const utcDateString = '2026-02-28T00:00:00.000Z';

      // Act
      const result = formatUTCDateToReadable(utcDateString);

      // Assert - Should always be Feb 28, regardless of local timezone
      expect(result).toBe('Feb 28, 2026');
    });
  });

  describe('formatUTCDateToYYYYMMDD', () => {
    it('should format UTC date string to YYYY-MM-DD format', () => {
      // Arrange
      const dateString = '2026-02-28T00:00:00.000Z';

      // Act
      const result = formatUTCDateToYYYYMMDD(dateString);

      // Assert
      expect(result).toBe('2026-02-28');
    });

    it('should handle various UTC dates', () => {
      expect(formatUTCDateToYYYYMMDD('2026-01-01T00:00:00.000Z')).toBe('2026-01-01');
      expect(formatUTCDateToYYYYMMDD('2026-12-31T00:00:00.000Z')).toBe('2026-12-31');
      expect(formatUTCDateToYYYYMMDD('2024-02-29T00:00:00.000Z')).toBe('2024-02-29');
    });

    it('should work with UTC dates that have time components', () => {
      // Arrange
      const dateString = '2026-02-28T15:30:45.123Z';

      // Act
      const result = formatUTCDateToYYYYMMDD(dateString);

      // Assert
      expect(result).toBe('2026-02-28');
    });
  });
});

describe('Date Utils - Existing Functions', () => {
  describe('formatDateToYYYYMMDD', () => {
    it('should format local Date object to YYYY-MM-DD', () => {
      // Arrange
      const date = new Date(2026, 1, 28); // Feb 28, 2026 local time

      // Act
      const result = formatDateToYYYYMMDD(date);

      // Assert
      expect(result).toBe('2026-02-28');
    });

    it('should handle single digit months and days with padding', () => {
      // Arrange
      const date = new Date(2026, 0, 5); // Jan 5, 2026

      // Act
      const result = formatDateToYYYYMMDD(date);

      // Assert
      expect(result).toBe('2026-01-05');
    });
  });

  describe('createDateFromYYYYMMDD', () => {
    it('should create local Date object from YYYY-MM-DD string', () => {
      // Arrange
      const dateString = '2026-02-28';

      // Act
      const result = createDateFromYYYYMMDD(dateString);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(28);
    });

    it('should create local time (not UTC)', () => {
      // Arrange
      const dateString = '2026-02-28';

      // Act
      const result = createDateFromYYYYMMDD(dateString);

      // Assert - Should be midnight local time, not UTC
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });
});

describe('Date Utils - Integration Tests', () => {
  it('should maintain date consistency through UTC conversion cycle', () => {
    // Arrange
    const originalDateString = '2026-02-28';

    // Act - Simulate the full cycle: string -> UTC midnight -> display -> string
    const utcDate = createDateAtMidnightUTC(originalDateString);
    const displayString = formatUTCDateToReadable(utcDate.toISOString());
    const backToString = formatUTCDateToYYYYMMDD(utcDate.toISOString());

    // Assert
    expect(displayString).toBe('Feb 28, 2026');
    expect(backToString).toBe(originalDateString);
  });

  it('should handle timezone edge cases correctly', () => {
    // Arrange
    const edgeDates = [
      '2026-01-01', // New Year
      '2026-12-31', // Year end
      '2024-02-29', // Leap year
    ];

    edgeDates.forEach(dateString => {
      // Act
      const utcDate = createDateAtMidnightUTC(dateString);
      const formatted = formatUTCDateToYYYYMMDD(utcDate.toISOString());

      // Assert
      expect(formatted).toBe(dateString);
    });
  });

  it('should demonstrate difference between local and UTC date creation', () => {
    // Arrange
    const dateString = '2026-02-28';

    // Act
    const localDate = createDateFromYYYYMMDD(dateString);
    const utcDate = createDateAtMidnightUTC(dateString);

    // Assert - They should be different Date objects representing different moments in time
    expect(localDate.getTime()).not.toBe(utcDate.getTime());
    
    // But they should represent the same calendar day in their respective timezones
    expect(localDate.getFullYear()).toBe(utcDate.getUTCFullYear());
    expect(localDate.getMonth()).toBe(utcDate.getUTCMonth());
    expect(localDate.getDate()).toBe(utcDate.getUTCDate());
  });
});

describe('Date Utils - Weekday Functions', () => {
  describe('countWeekdaysInPeriod', () => {
    it('should count weekdays correctly for a standard week', () => {
      // Arrange - Monday to Friday (5 weekdays)
      const startDate = new Date('2026-02-23'); // Monday
      const endDate = new Date('2026-02-27'); // Friday

      // Act
      const result = countWeekdaysInPeriod(startDate, endDate);

      // Assert
      expect(result).toBe(5);
    });

    it('should exclude weekends', () => {
      // Arrange - Full week including weekend
      const startDate = new Date('2026-02-23'); // Monday
      const endDate = new Date('2026-03-01'); // Sunday

      // Act
      const result = countWeekdaysInPeriod(startDate, endDate);

      // Assert - Should only count Mon-Fri (5 days)
      expect(result).toBe(5);
    });

    it('should handle single day periods', () => {
      // Arrange
      const weekdayDate = new Date('2026-02-25'); // Wednesday
      const weekendDate = new Date('2026-02-28'); // Saturday

      // Act & Assert
      expect(countWeekdaysInPeriod(weekdayDate, weekdayDate)).toBe(1);
      expect(countWeekdaysInPeriod(weekendDate, weekendDate)).toBe(0);
    });

    it('should handle multi-month periods', () => {
      // Arrange - Feb 23 to Mar 6 (10 weekdays)
      const startDate = new Date('2026-02-23'); // Monday
      const endDate = new Date('2026-03-06'); // Friday

      // Act
      const result = countWeekdaysInPeriod(startDate, endDate);

      // Assert
      expect(result).toBe(10);
    });
  });

  describe('getWeekdaysInPeriod', () => {
    it('should return array of weekday dates', () => {
      // Arrange - Monday to Wednesday
      const startDate = new Date('2026-02-23'); // Monday
      const endDate = new Date('2026-02-25'); // Wednesday

      // Act
      const result = getWeekdaysInPeriod(startDate, endDate);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(Date);
      expect(result[0].getDay()).toBe(1); // Monday
      expect(result[1].getDay()).toBe(2); // Tuesday
      expect(result[2].getDay()).toBe(3); // Wednesday
    });

    it('should exclude weekends from returned array', () => {
      // Arrange - Full week
      const startDate = new Date('2026-02-23'); // Monday
      const endDate = new Date('2026-03-01'); // Sunday

      // Act
      const result = getWeekdaysInPeriod(startDate, endDate);

      // Assert - Should only have 5 dates (Mon-Fri)
      expect(result).toHaveLength(5);
      result.forEach(date => {
        const dayOfWeek = date.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      });
    });

    it('should return empty array for weekend-only period', () => {
      // Arrange - Saturday to Sunday
      const startDate = new Date('2026-02-28'); // Saturday
      const endDate = new Date('2026-03-01'); // Sunday

      // Act
      const result = getWeekdaysInPeriod(startDate, endDate);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('isWeekday', () => {
    it('should return true for weekdays', () => {
      const monday = new Date('2026-02-23'); // Monday
      const wednesday = new Date('2026-02-25'); // Wednesday
      const friday = new Date('2026-02-27'); // Friday

      expect(isWeekday(monday)).toBe(true);
      expect(isWeekday(wednesday)).toBe(true);
      expect(isWeekday(friday)).toBe(true);
    });

    it('should return false for weekends', () => {
      const saturday = new Date('2026-02-28'); // Saturday
      const sunday = new Date('2026-03-01'); // Sunday

      expect(isWeekday(saturday)).toBe(false);
      expect(isWeekday(sunday)).toBe(false);
    });
  });

  describe('isWeekend', () => {
    it('should return false for weekdays', () => {
      const monday = new Date('2026-02-23'); // Monday
      const wednesday = new Date('2026-02-25'); // Wednesday
      const friday = new Date('2026-02-27'); // Friday

      expect(isWeekend(monday)).toBe(false);
      expect(isWeekend(wednesday)).toBe(false);
      expect(isWeekend(friday)).toBe(false);
    });

    it('should return true for weekends', () => {
      const saturday = new Date('2026-02-28'); // Saturday
      const sunday = new Date('2026-03-01'); // Sunday

      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
    });
  });

  describe('isDateInRange', () => {
    it('should return true for dates within range', () => {
      // Arrange
      const startDate = new Date('2026-02-23');
      const endDate = new Date('2026-02-27');
      const dateInRange = new Date('2026-02-25');

      // Act & Assert
      expect(isDateInRange(dateInRange, startDate, endDate)).toBe(true);
    });

    it('should return true for boundary dates', () => {
      // Arrange
      const startDate = new Date('2026-02-23');
      const endDate = new Date('2026-02-27');

      // Act & Assert
      expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
      expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
    });

    it('should return false for dates outside range', () => {
      // Arrange
      const startDate = new Date('2026-02-23');
      const endDate = new Date('2026-02-27');
      const beforeRange = new Date('2026-02-22');
      const afterRange = new Date('2026-02-28');

      // Act & Assert
      expect(isDateInRange(beforeRange, startDate, endDate)).toBe(false);
      expect(isDateInRange(afterRange, startDate, endDate)).toBe(false);
    });
  });
});
