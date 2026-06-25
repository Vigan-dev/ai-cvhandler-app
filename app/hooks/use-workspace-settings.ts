"use client";

import { usePersistentState } from "./use-persistent-state";

export type RetentionDays = 0 | 30 | 90 | 365;

export const PRIVACY_ACKNOWLEDGED_STORAGE_KEY =
  "talentlens-privacy-acknowledged";
export const RETENTION_DAYS_STORAGE_KEY = "talentlens-retention-days";

export function usePrivacyAcknowledged() {
  return usePersistentState(PRIVACY_ACKNOWLEDGED_STORAGE_KEY, false, {
    validate: (value): value is boolean => typeof value === "boolean",
  });
}

export function useRetentionDays() {
  return usePersistentState<RetentionDays>(RETENTION_DAYS_STORAGE_KEY, 0, {
    validate: isRetentionDays,
  });
}

function isRetentionDays(value: unknown): value is RetentionDays {
  return value === 0 || value === 30 || value === 90 || value === 365;
}
