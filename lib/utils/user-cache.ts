interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  permissions?: string[];
}

interface CachedUserData {
  user: User;
  timestamp: number;
}

const CACHE_KEY = 'cached_user';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const userCache = {
  /**
   * Get cached user data if valid
   */
  getCachedUser(): User | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { user: cachedUser, timestamp }: CachedUserData = JSON.parse(cached);
      const now = Date.now();
      
      // Cache is valid for 5 minutes
      if (now - timestamp < CACHE_DURATION) {
        return cachedUser;
      }
      
      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Set user data in cache with timestamp
   */
  setCachedUser(userData: User | null): void {
    try {
      if (userData) {
        const cacheData: CachedUserData = {
          user: userData,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  },

  /**
   * Clear cached user data
   */
  clearCachedUser(): void {
    localStorage.removeItem(CACHE_KEY);
  },

  /**
   * Check if cached data exists and is valid
   */
  hasValidCache(): boolean {
    return this.getCachedUser() !== null;
  },

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(): number | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { timestamp }: CachedUserData = JSON.parse(cached);
      return Date.now() - timestamp;
    } catch {
      return null;
    }
  }
};
