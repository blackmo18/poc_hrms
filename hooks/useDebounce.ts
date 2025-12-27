import { useCallback, useRef } from "react";

/**
 * Custom hook for debouncing functions
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Return debounced function with cancel method attached
  const debouncedWithCancel = useCallback(
    (...args: Parameters<T>) => {
      debouncedFunction(...args);
    },
    [debouncedFunction]
  ) as T & { cancel: () => void };

  debouncedWithCancel.cancel = cancel;

  return debouncedWithCancel;
}

/**
 * Custom hook for debounced search with minimum character requirement
 * @param searchFunction - The search function to call
 * @param minLength - Minimum characters required to trigger search (default: 3)
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns Object with debounced search function and cancel method
 */
export function useDebouncedSearch<T extends string>(
  searchFunction: (query: T, page?: number) => void,
  minLength: number = 3,
  delay: number = 300
) {
  const debouncedSearch = useDebounce(searchFunction, delay);

  const handleSearch = useCallback(
    (query: T) => {
      // Only search if query meets minimum length or is empty
      if (query.length >= minLength || query.length === 0) {
        debouncedSearch(query);
      }
    },
    [debouncedSearch, minLength]
  );

  const cancel = useCallback(() => {
    (debouncedSearch as any).cancel();
  }, [debouncedSearch]);

  return {
    handleSearch,
    cancel,
  };
}

/**
 * Custom hook for debounced API calls with loading state
 * @param apiFunction - The API function to call
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns Object with debounced function, loading state, and cancel method
 */
export function useDebouncedApi<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(false);

  const debouncedApi = useCallback(
    async (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise<ReturnType<T>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            loadingRef.current = true;
            const result = await apiFunction(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            loadingRef.current = false;
          }
        }, delay);
      });
    },
    [apiFunction, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    loadingRef.current = false;
  }, []);

  const isLoading = useCallback(() => loadingRef.current, []);

  return {
    debouncedApi,
    cancel,
    isLoading,
  };
}
