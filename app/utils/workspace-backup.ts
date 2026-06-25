import type { JobProfile } from "../data/job-profiles.ts";
import type { Candidate } from "../data/mock-data.ts";
import type { WorkspaceNotification } from "../hooks/use-notifications";

export const WORKSPACE_BACKUP_VERSION = 1;

export const WORKSPACE_PREFERENCE_KEYS = [
  "talentlens-theme",
  "talentlens-candidate-query",
  "talentlens-candidate-status",
  "talentlens-candidate-view",
  "talentlens-candidate-min-score",
  "talentlens-candidate-role",
  "talentlens-candidate-sort",
  "talentlens-analytics-range",
  "talentlens-pipeline-range",
  "talentlens-privacy-acknowledged",
  "talentlens-retention-days",
] as const;

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
    parsed.schemaVersion !== WORKSPACE_BACKUP_VERSION ||
    typeof parsed.exportedAt !== "string" ||
    !isRecord(parsed.data) ||
    !isCandidateArray(parsed.data.candidates) ||
    !isJobProfileArray(parsed.data.jobProfiles) ||
    typeof parsed.data.selectedJobId !== "string" ||
    !isNotificationArray(parsed.data.notifications) ||
    !isRecord(parsed.data.preferences)
  ) {
    throw new Error(
      "This file is not a compatible TalentLens workspace backup.",
    );
  }

  const selectedJobId = parsed.data.selectedJobId;
  if (
    !parsed.data.jobProfiles.some(
      (profile) => profile.id === selectedJobId,
    )
  ) {
    throw new Error("The backup references a missing selected job profile.");
  }

  return parsed as WorkspaceBackup;
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
        typeof profile.minimumExperienceYears === "number" &&
        profile.minimumExperienceYears >= 0 &&
        isStringArray(profile.educationKeywords) &&
        isWeights(profile.weights) &&
        typeof profile.createdAt === "string" &&
        typeof profile.updatedAt === "string",
    )
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
