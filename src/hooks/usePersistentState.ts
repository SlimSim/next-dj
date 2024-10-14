// src/hooks/usePersistentState.ts
import { useEffect, useState } from "react";

export const usePersistentState = <T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
