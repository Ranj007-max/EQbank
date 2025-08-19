import { useRef, useEffect, useCallback } from 'react';

/**
 * Creates a debounced version of a callback that delays its execution.
 * @param callback The function to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns A memoized, debounced version of the callback.
 */
export function useDebouncedCallback<A extends any[]>(
  callback: (...args: A) => void,
  delay: number
): (...args: A) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update the callback reference if it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: A) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}
