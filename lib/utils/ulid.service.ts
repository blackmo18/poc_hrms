import { monotonicFactory } from 'ulid';

const ulidFactory = monotonicFactory();

// Create singleton instance
let ulidService: ULIDService;

export class ULIDService {
  /**
   * Generate a monotonic ULID (Universally Unique Lexicographically Sortable Identifier)
   * Monotonic ensures IDs are always increasing, preventing duplicates and improving DB indexing
   */
  generate(): string {
    return ulidFactory();
  }

  /**
   * Generate multiple ULIDs at once
   */
  generateMany(count: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generate());
    }
    return ids;
  }

  /**
   * Validate if a string is a valid ULID
   */
  isValid(id: string): boolean {
    // ULID validation: 26 characters, base32, starts with timestamp
    return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id);
  }

  /**
   * Extract timestamp from ULID (first 10 characters represent milliseconds since Unix epoch)
   */
  extractTimestamp(ulid: string): number {
    if (!this.isValid(ulid)) {
      throw new Error('Invalid ULID format');
    }
    return parseInt(ulid.substring(0, 10), 32);
  }

  /**
   * Get current timestamp as ULID-compatible format
   */
  getTimestamp(): string {
    return ulidFactory().substring(0, 10);
  }
}

/**
 * Get singleton instance of ULID service
 */
export function getULIDService(): ULIDService {
  if (!ulidService) {
    ulidService = new ULIDService();
  }
  return ulidService;
}

/**
 * Convenience function to generate a single ULID
 */
export function generateULID(): string {
  return getULIDService().generate();
}

/**
 * Convenience function to generate multiple ULIDs
 */
export function generateULIDs(count: number): string[] {
  return getULIDService().generateMany(count);
}
