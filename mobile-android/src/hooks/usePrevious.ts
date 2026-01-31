import { useEffect, useRef } from "react";

/**
 * usePrevious hook
 *
 * Returns the previous value of a variable.
 * Useful for tracking changes across renders.
 *
 * @param value - The current value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
