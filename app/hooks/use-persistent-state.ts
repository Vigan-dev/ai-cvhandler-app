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
import {
  assertStorageWriteFits,
  getStorageRecoveryDetail,
  type StorageRecoveryDetail,
} from "../utils/local-storage-guard";

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
  const synchronizeRef = useRef<StorageListener | null>(null);

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
      if (!isJsonEqual(valueRef.current, migrated.value)) {
        valueRef.current = migrated.value;
        setValue(migrated.value);
      }
      if (migrated.migrated) writeStoredValue(key, migrated.value);
      recordWorkspaceSchemaVersion(key);
    };
    synchronizeRef.current = synchronize;

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
      if (synchronizeRef.current === synchronize) synchronizeRef.current = null;
    };
  }, [key]);

  const setPersistentValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const nextValue =
        typeof action === "function"
          ? (action as (current: T) => T)(valueRef.current)
          : action;
      const migrated = migrateWorkspaceValue(key, nextValue);
      if (!isValid(migrated.value, validateRef.current)) return;
      const committedValue = migrated.value;

      if (!isJsonEqual(valueRef.current, committedValue)) {
        valueRef.current = committedValue;
        setValue(committedValue);
      }
      writeStoredValue(key, committedValue);

      listeners.get(key)?.forEach((listener) => {
        if (listener !== synchronizeRef.current) listener(committedValue);
      });
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
    const serialized = JSON.stringify(value);
    if (localStorage.getItem(key) !== serialized) {
      assertStorageWriteFits(key, serialized);
      localStorage.setItem(key, serialized);
    }
    recordWorkspaceSchemaVersion(key);
  } catch (error) {
    notifyStorageFailure(error);
  }
}

function recordWorkspaceSchemaVersion(key: string) {
  if (key === WORKSPACE_SCHEMA_STORAGE_KEY) return;

  try {
    const serialized = JSON.stringify(WORKSPACE_SCHEMA_VERSION);
    if (localStorage.getItem(WORKSPACE_SCHEMA_STORAGE_KEY) !== serialized) {
      localStorage.setItem(WORKSPACE_SCHEMA_STORAGE_KEY, serialized);
    }
  } catch (error) {
    notifyStorageFailure(error);
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

function isJsonEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function notifyStorageFailure(error?: unknown) {
  window.dispatchEvent(
    new CustomEvent<StorageRecoveryDetail>("talentlens-storage-error", {
      detail: getStorageRecoveryDetail(error),
    }),
  );
}
