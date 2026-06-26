import type { JobProfile } from "../data/job-profiles.ts";
import type { Candidate } from "../data/mock-data.ts";
import type { WorkspaceNotification } from "../hooks/use-notifications";
import {
  migrateWorkspacePreferences,
  migrateWorkspaceValue,
  WORKSPACE_PREFERENCE_KEYS,
  WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_STORAGE_KEYS,
} from "./workspace-migrations.ts";

export const WORKSPACE_BACKUP_VERSION = WORKSPACE_SCHEMA_VERSION;
export { WORKSPACE_PREFERENCE_KEYS };

export type WorkspaceBackup = {
  product: "TalentLens";
  schemaVersion: typeof WORKSPACE_BACKUP_VERSION;
  exportedAt: string;
  data: {
    candidates: Candidate[];
    jobProfiles: JobProfile[];
    selectedJobId: string;
    notifications: WorkspaceNotification[];
    preferences: Record<string, unknown>;
  };
};

export function createWorkspaceBackup(input: WorkspaceBackup["data"]) {
  return {
    product: "TalentLens",
    schemaVersion: WORKSPACE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: input,
  } satisfies WorkspaceBackup;
}

export function serializeWorkspaceBackup(backup: WorkspaceBackup) {
  return JSON.stringify(backup, null, 2);
}

export function parseWorkspaceBackup(value: string): WorkspaceBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (
    !isRecord(parsed) ||
    parsed.product !== "TalentLens" ||
    !isSupportedBackupVersion(parsed.schemaVersion) ||
    typeof parsed.exportedAt !== "string" ||
    !isRecord(parsed.data)
  ) {
    throw new Error(
      "This file is not a compatible TalentLens workspace backup.",
    );
  }

  const migrated = {
    product: "TalentLens",
    schemaVersion: WORKSPACE_BACKUP_VERSION,
    exportedAt: parsed.exportedAt,
    data: migrateBackupData(parsed.data),
  } satisfies WorkspaceBackup;

  if (
    !isCandidateArray(migrated.data.candidates) ||
    !isJobProfileArray(migrated.data.jobProfiles) ||
    typeof migrated.data.selectedJobId !== "string" ||
    !isNotificationArray(migrated.data.notifications) ||
    !isRecord(migrated.data.preferences)
  ) {
    throw new Error(
      "This file is not a compatible TalentLens workspace backup.",
    );
  }

  const selectedJobId = migrated.data.selectedJobId;
  if (
    !migrated.data.jobProfiles.some(
      (profile) => profile.id === selectedJobId,
    )
  ) {
    throw new Error("The backup references a missing selected job profile.");
  }

  return migrated;
}

function migrateBackupData(data: Record<string, unknown>): WorkspaceBackup["data"] {
  const candidates = migrateWorkspaceValue(
    WORKSPACE_STORAGE_KEYS.candidates,
    Array.isArray(data.candidates) ? data.candidates : [],
  ).value;
  const jobProfiles = migrateWorkspaceValue(
    WORKSPACE_STORAGE_KEYS.jobProfiles,
    data.jobProfiles,
  ).value;
  const migratedJobProfiles = jobProfiles as JobProfile[];
  const selectedJobId = getSelectedJobId(
    data.selectedJobId,
    migratedJobProfiles,
  );
  const notifications = migrateWorkspaceValue(
    WORKSPACE_STORAGE_KEYS.notifications,
    Array.isArray(data.notifications) ? data.notifications : [],
  ).value;
  const preferences = migrateWorkspacePreferences(
    isRecord(data.preferences) ? data.preferences : {},
  );

  return {
    candidates: candidates as Candidate[],
    jobProfiles: migratedJobProfiles,
    selectedJobId,
    notifications: notifications as WorkspaceNotification[],
    preferences,
  };
}

function isSupportedBackupVersion(value: unknown) {
  return value === undefined || value === 1 || value === WORKSPACE_BACKUP_VERSION;
}

function getSelectedJobId(value: unknown, jobProfiles: JobProfile[]) {
  if (
    typeof value === "string" &&
    jobProfiles.some((profile) => profile.id === value)
  ) {
    return value;
  }

  return jobProfiles[0]?.id ?? "";
}

function isCandidateArray(value: unknown): value is Candidate[] {
  return (
    Array.isArray(value) &&
    value.every(
      (candidate) =>
        isRecord(candidate) &&
        typeof candidate.id === "number" &&
        Number.isFinite(candidate.id) &&
        typeof candidate.name === "string" &&
        typeof candidate.role === "string" &&
        typeof candidate.location === "string" &&
        typeof candidate.avatar === "string" &&
        typeof candidate.color === "string" &&
        isScore(candidate.score) &&
        isScore(candidate.skills) &&
        isScore(candidate.experience) &&
        isScore(candidate.education) &&
        isCandidateStatus(candidate.status) &&
        isCandidateStage(candidate.stage) &&
        isStringArray(candidate.tags) &&
        isStringArray(candidate.strengths) &&
        isStringArray(candidate.weaknesses),
    )
  );
}

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
        isOptionalRequiredSkillStrictness(profile.requiredSkillStrictness) &&
        isOptionalSkillAliases(profile.skillAliases) &&
        typeof profile.minimumExperienceYears === "number" &&
        profile.minimumExperienceYears >= 0 &&
        isStringArray(profile.educationKeywords) &&
        isWeights(profile.weights) &&
        typeof profile.createdAt === "string" &&
        typeof profile.updatedAt === "string",
    )
  );
}

function isOptionalRequiredSkillStrictness(value: unknown) {
  return (
    value === undefined ||
    value === "flexible" ||
    value === "balanced" ||
    value === "strict"
  );
}

function isOptionalSkillAliases(value: unknown) {
  return (
    value === undefined ||
    (isRecord(value) &&
      Object.values(value).every(
        (aliases) =>
          Array.isArray(aliases) &&
          aliases.every((alias) => typeof alias === "string"),
      ))
  );
}

function isNotificationArray(
  value: unknown,
): value is WorkspaceNotification[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.detail === "string" &&
        typeof item.href === "string" &&
        item.href.startsWith("/") &&
        typeof item.read === "boolean" &&
        typeof item.createdAt === "string",
    )
  );
}

function isWeights(value: unknown) {
  return (
    isRecord(value) &&
    isNonNegativeNumber(value.skills) &&
    isNonNegativeNumber(value.experience) &&
    isNonNegativeNumber(value.education) &&
    isNonNegativeNumber(value.impact)
  );
}

function isCandidateStatus(value: unknown) {
  return value === "Hire" || value === "Review" || value === "Reject";
}

function isCandidateStage(value: unknown) {
  return (
    value === "New" ||
    value === "Review" ||
    value === "Interview" ||
    value === "Rejected"
  );
}

function isScore(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
