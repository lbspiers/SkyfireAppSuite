// src/hooks/useDebounce.ts
import { useEffect, useState } from "react";

/**
 * Custom React Hook: useDebounce
 *
 * @param value - The value you want to debounce
 * @param delay - Delay in milliseconds (default 500ms)
 * @returns Debounced version of the value
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
