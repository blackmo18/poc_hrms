import { describe, it, expect } from 'vitest';
import { 
  ensureUTCForStorage,
  isValidISODate
} from '../timezone-utils';

describe('Timezone Utils', () => {
  describe('ensureUTCForStorage', () => {
    it('should convert Date object to UTC', () => {
      const manilaDate = new Date('2024-01-15T12:00:00');
      const utcDate = ensureUTCForStorage(manilaDate);
      
      expect(utcDate).toBeDefined();
      if (utcDate) {
        // Should preserve the same moment in time
        expect(utcDate.getTime()).toBe(manilaDate.getTime());
      }
    });

    it('should convert ISO date string to UTC', () => {
      const isoDateStr = '2024-01-15T12:00:00.000Z';
      const utcDate = ensureUTCForStorage(isoDateStr);
      
      expect(utcDate).toBeDefined();
      if (utcDate) {
        expect(utcDate.toISOString()).toBe(isoDateStr);
      }
    });

    it('should convert Manila timezone ISO string to UTC', () => {
      const manilaISO = '2024-01-15T12:00:00+08:00';
      const utcDate = ensureUTCForStorage(manilaISO);
      
      expect(utcDate).toBeDefined();
      if (utcDate) {
        // Should be 4:00 AM UTC
        expect(utcDate.getUTCHours()).toBe(4);
        expect(utcDate.getUTCDate()).toBe(15);
      }
    });

    it('should return undefined for undefined input', () => {
      const result = ensureUTCForStorage(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('isValidISODate', () => {
    it('should validate ISO date format correctly', () => {
      expect(isValidISODate('2024-01-15')).toBe(true);
      expect(isValidISODate('2024-01-15T00:00:00.000Z')).toBe(true);
      expect(isValidISODate('2024-01-15T08:00:00+08:00')).toBe(true);
      expect(isValidISODate('2024-01-15T12:30:45')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidISODate('')).toBe(false);
      expect(isValidISODate('invalid-date')).toBe(false);
      expect(isValidISODate('15-01-2024')).toBe(false);
      expect(isValidISODate('2024/01/15')).toBe(false);
      expect(isValidISODate('Jan 15, 2024')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidISODate(null as any)).toBe(false);
      expect(isValidISODate(undefined as any)).toBe(false);
    });
  });
});

describe('API Requirements Tests', () => {
  describe('ISO Date Input Validation', () => {
    it('should accept valid ISO date formats for API input', () => {
      // These should all be valid for API input
      expect(isValidISODate('2024-01-15')).toBe(true);
      expect(isValidISODate('2024-01-15T00:00:00.000Z')).toBe(true);
      expect(isValidISODate('2024-01-15T12:30:45.123Z')).toBe(true);
    });

    it('should reject non-ISO formats for API input', () => {
      // These should all be rejected by API validation
      expect(isValidISODate('01/15/2024')).toBe(false);
      expect(isValidISODate('Jan 15, 2024')).toBe(false);
      expect(isValidISODate('15-Jan-2024')).toBe(false);
    });
  });

  describe('ISO to UTC Conversion for Storage', () => {
    it('should convert ISO date string to UTC for storage', () => {
      // API receives ISO string in UTC
      const utcISO = '2024-01-15T04:00:00.000Z';
      const utcDate = ensureUTCForStorage(utcISO);
      
      expect(utcDate).toBeDefined();
      if (utcDate) {
        // Should be exactly the same in UTC
        expect(utcDate.getUTCHours()).toBe(4);
        expect(utcDate.getUTCDate()).toBe(15);
      }
    });

    it('should handle date-only ISO string for workDate', () => {
      // API receives date-only ISO string for workDate
      const workDateISO = '2024-01-15';
      const utcDate = ensureUTCForStorage(workDateISO);
      
      expect(utcDate).toBeDefined();
      if (utcDate) {
        // Date should be preserved in UTC
        expect(utcDate.getUTCDate()).toBe(15);
        expect(utcDate.getUTCMonth()).toBe(0);
        expect(utcDate.getUTCFullYear()).toBe(2024);
      }
    });
  });

  describe('UTC Response Format', () => {
    it('should return UTC times in ISO format for API response', () => {
      // Database has UTC date
      const utcDate = new Date(Date.UTC(2024, 0, 15, 4, 30, 45));
      
      // API should return ISO string
      const apiResponse = utcDate.toISOString();
      
      expect(apiResponse).toBe('2024-01-15T04:30:45.000Z');
      expect(apiResponse.endsWith('Z')).toBe(true); // Indicates UTC
    });
  });

  describe('Round Trip: API Input -> Storage -> Response', () => {
    it('should maintain data integrity through the full flow', () => {
      // 1. Client sends ISO date in UTC
      const clientInput = '2024-01-15T06:30:00.000Z';
      
      // 2. API validates and stores as UTC
      expect(isValidISODate(clientInput)).toBe(true);
      const utcForStorage = ensureUTCForStorage(clientInput);
      
      expect(utcForStorage).toBeDefined();
      if (utcForStorage) {
        // Should be exactly the same in UTC
        expect(utcForStorage.getUTCHours()).toBe(6);
        expect(utcForStorage.getUTCMinutes()).toBe(30);
        
        // 3. API returns UTC as ISO string
        const apiResponse = utcForStorage.toISOString();
        expect(apiResponse).toBe('2024-01-15T06:30:00.000Z');
        
        // 4. Client receives the same UTC time
        const clientReceives = new Date(apiResponse);
        expect(clientReceives.toISOString()).toBe(clientInput);
      }
    });
  });
});
