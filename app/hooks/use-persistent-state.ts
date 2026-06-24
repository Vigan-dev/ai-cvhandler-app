"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      const saved = localStorage.getItem(key);

      if (saved) {
        try {
          setValue(JSON.parse(saved) as T);
        } catch {
          localStorage.removeItem(key);
        }
      }

      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent(`talentlens-storage:${key}`, { detail: value }),
    );
  }, [hydrated, key, value]);

  useEffect(() => {
    function synchronize(event: Event) {
      setValue((event as CustomEvent<T>).detail);
    }

    window.addEventListener(`talentlens-storage:${key}`, synchronize);
    return () => {
      window.removeEventListener(`talentlens-storage:${key}`, synchronize);
    };
  }, [key]);

  return [value, setValue, hydrated] as const;
}
