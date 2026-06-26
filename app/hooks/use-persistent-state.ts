"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  migrateWorkspaceValue,
  WORKSPACE_SCHEMA_STORAGE_KEY,
  WORKSPACE_SCHEMA_VERSION,
} from "../utils/workspace-migrations";

type PersistentStateOptions<T> = {
  validate?: (value: unknown) => value is T;
};

type StorageListener = (value: unknown) => void;

const listeners = new Map<string, Set<StorageListener>>();

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: PersistentStateOptions<T> = {},
) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const valueRef = useRef(value);
  const initialValueRef = useRef(initialValue);
  const validateRef = useRef(options.validate);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    initialValueRef.current = initialValue;
    validateRef.current = options.validate;
  }, [initialValue, options.validate]);

  useEffect(() => {
    let cancelled = false;

    const synchronize: StorageListener = (nextValue) => {
      if (cancelled) return;

      const migrated = migrateWorkspaceValue(key, nextValue);
      if (!isValid(migrated.value, validateRef.current)) return;
      valueRef.current = migrated.value;
      setValue(migrated.value);
      if (migrated.migrated) writeStoredValue(key, migrated.value);
      recordWorkspaceSchemaVersion(key);
    };

    const keyListeners = listeners.get(key) ?? new Set<StorageListener>();
    keyListeners.add(synchronize);
    listeners.set(key, keyListeners);

    function handleStorage(event: StorageEvent) {
      if (event.key !== key) return;

      if (event.newValue === null) {
        synchronize(initialValueRef.current);
        return;
      }

      const parsed = parseStoredValue(event.newValue);
      if (parsed.ok) synchronize(parsed.value);
    }

    window.addEventListener("storage", handleStorage);

    queueMicrotask(() => {
      if (cancelled) return;

      const stored = readStoredValue(
        key,
        initialValueRef.current,
        validateRef.current,
      );
      valueRef.current = stored;
      setValue(stored);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
      keyListeners.delete(synchronize);
      if (keyListeners.size === 0) listeners.delete(key);
    };
  }, [key]);

  const setPersistentValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const nextValue =
        typeof action === "function"
          ? (action as (current: T) => T)(valueRef.current)
          : action;

      valueRef.current = nextValue;
      setValue(nextValue);
      writeStoredValue(key, nextValue);

      listeners.get(key)?.forEach((listener) => listener(nextValue));
    },
    [key],
  );

  return [value, setPersistentValue, hydrated] as const;
}

function readStoredValue<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const parsed = parseStoredValue(raw);
    if (parsed.ok) {
      const migrated = migrateWorkspaceValue(key, parsed.value);
      if (isValid(migrated.value, validate)) {
        if (migrated.migrated) writeStoredValue(key, migrated.value);
        recordWorkspaceSchemaVersion(key);
        return migrated.value;
      }
    }

    localStorage.removeItem(key);
  } catch {
    notifyStorageFailure();
  }

  return fallback;
}

function writeStoredValue<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    recordWorkspaceSchemaVersion(key);
  } catch {
    notifyStorageFailure();
  }
}

function recordWorkspaceSchemaVersion(key: string) {
  if (key === WORKSPACE_SCHEMA_STORAGE_KEY) return;

  try {
    localStorage.setItem(
      WORKSPACE_SCHEMA_STORAGE_KEY,
      JSON.stringify(WORKSPACE_SCHEMA_VERSION),
    );
  } catch {
    notifyStorageFailure();
  }
}

function parseStoredValue(raw: string):
  | { ok: true; value: unknown }
  | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

function isValid<T>(
  value: unknown,
  validate?: (value: unknown) => value is T,
): value is T {
  return validate ? validate(value) : true;
}

function notifyStorageFailure() {
  window.dispatchEvent(new Event("talentlens-storage-error"));
}
