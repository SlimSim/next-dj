import { useState, useEffect } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Initialize state with persisted value or default
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    }
    return defaultValue;
  });

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
