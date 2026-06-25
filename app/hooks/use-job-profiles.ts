"use client";

import {
  createJobProfileId,
  defaultJobProfiles,
  type JobProfile,
  type JobProfileWeights,
  normalizeWeights,
} from "../data/job-profiles";
import { usePersistentState } from "./use-persistent-state";

export const JOB_PROFILES_STORAGE_KEY = "talentlens-job-profiles";
export const SELECTED_JOB_STORAGE_KEY = "talentlens-selected-job-profile";

export function useJobProfiles() {
  return usePersistentState<JobProfile[]>(
    JOB_PROFILES_STORAGE_KEY,
    defaultJobProfiles,
    { validate: isJobProfileArray },
  );
}

export function useSelectedJobProfileId() {
  return usePersistentState(
    SELECTED_JOB_STORAGE_KEY,
    defaultJobProfiles[0].id,
    { validate: (value): value is string => typeof value === "string" },
  );
}

export { createJobProfileId, normalizeWeights };

function isJobProfileArray(value: unknown): value is JobProfile[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (profile) =>
        isRecord(profile) &&
        typeof profile.id === "string" &&
        typeof profile.name === "string" &&
        typeof profile.description === "string" &&
        isStringArray(profile.requiredSkills) &&
        isStringArray(profile.optionalSkills) &&
        typeof profile.minimumExperienceYears === "number" &&
        profile.minimumExperienceYears >= 0 &&
        isStringArray(profile.educationKeywords) &&
        isWeights(profile.weights) &&
        typeof profile.createdAt === "string" &&
        typeof profile.updatedAt === "string",
    )
  );
}

function isWeights(value: unknown): value is JobProfileWeights {
  return (
    isRecord(value) &&
    isNonNegativeNumber(value.skills) &&
    isNonNegativeNumber(value.experience) &&
    isNonNegativeNumber(value.education) &&
    isNonNegativeNumber(value.impact)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
