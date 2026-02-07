/**
 * Global fetch interceptor for handling 401 session invalidation
 * Redirects to login when session is invalid
 */

let redirectCallback: (() => void) | null = null;

/**
 * Register a callback to be called when session is invalidated (401 response)
 */
export function registerSessionInvalidationCallback(callback: () => void) {
  redirectCallback = callback;
}

/**
 * Intercept fetch requests and handle 401 responses
 */
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const response = await originalFetch(...args);

      // Check if response is 401 (Unauthorized)
      if (response.status === 401) {
        console.warn('Session invalidated (401 response), triggering redirect to login');
        
        // Call the registered callback to redirect to login
        if (redirectCallback) {
          redirectCallback();
        }
      }

      return response;
    } catch (error) {
      // Network errors or other issues
      throw error;
    }
  };
}

/**
 * Clear the session invalidation callback
 */
export function clearSessionInvalidationCallback() {
  redirectCallback = null;
}
