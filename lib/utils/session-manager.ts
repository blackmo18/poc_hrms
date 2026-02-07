'use client';

interface User {
  id: string;
  email: string;
  username: string;
}

interface SessionData {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  timestamp: number;
  sessionId: string;
}

const SESSION_KEY = 'auth_session';
const SESSION_EVENT = 'auth_session_change';

export class SessionManager {
  private static instance: SessionManager | null = null;
  private listeners: Set<(data: SessionData) => void> = new Set();
  private currentSessionId: string;

  constructor() {
    // Generate unique session ID for this tab
    this.currentSessionId = this.generateSessionId();

    // Only add event listeners if window is available (client-side)
    if (typeof window !== 'undefined') {
      // Listen for storage changes from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));

      // Listen for custom session change events within the same tab
      window.addEventListener(SESSION_EVENT, this.handleSessionEvent.bind(this));
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      // Only create instance if we're on the client side
      if (typeof window !== 'undefined') {
        SessionManager.instance = new SessionManager();
      } else {
        // Return a dummy instance for SSR that doesn't access window
        SessionManager.instance = Object.create(SessionManager.prototype);
        SessionManager.instance.listeners = new Set();
        SessionManager.instance.currentSessionId = 'ssr-session';
      }
    }
    return SessionManager.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === SESSION_KEY) {
      try {
        const sessionData: SessionData | null = event.newValue ? JSON.parse(event.newValue) : null;
        this.notifyListeners(sessionData);
      } catch (error) {
        console.error('Failed to parse session data:', error);
      }
    }
  }

  private handleSessionEvent(event: CustomEvent<SessionData>) {
    this.notifyListeners(event.detail);
  }

  private notifyListeners(data: SessionData | null) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  /**
   * Set authenticated user session with tokens
   */
  setAuthenticatedUser(user: User, accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return; // Skip on server
    
    const sessionData: SessionData = {
      user,
      accessToken,
      refreshToken,
      timestamp: Date.now(),
      sessionId: this.currentSessionId
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    this.notifyListeners(sessionData);
  }

  /**
   * Update access token (for token refresh)
   */
  updateAccessToken(accessToken: string): void {
    if (typeof window === 'undefined') return; // Skip on server
    
    const currentSession = this.getSessionData();
    if (currentSession && currentSession.user) {
      const updatedSession: SessionData = {
        ...currentSession,
        accessToken,
        timestamp: Date.now()
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      this.notifyListeners(updatedSession);
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    const sessionData = this.getSessionData();
    return sessionData?.accessToken || null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    const sessionData = this.getSessionData();
    return sessionData?.refreshToken || null;
  }

  /**
   * Clear session (logout)
   */
  clearSession(): void {
    if (typeof window === 'undefined') return; // Skip on server
    
    const sessionData: SessionData = {
      user: null,
      accessToken: null,
      refreshToken: null,
      timestamp: Date.now(),
      sessionId: this.currentSessionId
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    this.notifyListeners(sessionData);
  }

  /**
   * Get current session data
   */
  getSessionData(): SessionData | null {
    if (typeof window === 'undefined') return null; // Return null on server
    
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    // Session is invalid if user is null or session was created by another tab's logout
    return sessionData.user !== null;
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (data: SessionData | null) => void): () => void {
    this.listeners.add(listener);

    // Immediately call listener with current session data
    const currentData = this.getSessionData();
    try {
      listener(currentData);
    } catch (error) {
      console.error('Initial session listener error:', error);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if session was invalidated by another tab
   */
  isSessionInvalidated(): boolean {
    const sessionData = this.getSessionData();
    return sessionData !== null && sessionData.user === null;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string {
    return this.currentSessionId;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
