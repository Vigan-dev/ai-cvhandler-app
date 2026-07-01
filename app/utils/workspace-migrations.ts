import {
  defaultJobProfiles,
  normalizeWeights,
  type JobProfile,
  type JobProfileWeights,
  type RequiredSkillStrictness,
  type SkillAliases,
} from "../data/job-profiles.ts";
import {
  ANALYSIS_VERSION,
  candidates as defaultCandidates,
  type AnalysisConfidence,
  type Candidate,
  type CandidateStage,
  type CandidateStatus,
  type ExtractionConfidence,
} from "../data/mock-data.ts";
import type { WorkspaceNotification } from "../hooks/use-notifications";

export const WORKSPACE_SCHEMA_VERSION = 3;
export const WORKSPACE_SCHEMA_STORAGE_KEY = "talentlens-workspace-schema-version";

export const WORKSPACE_STORAGE_KEYS = {
  candidates: "talentlens-candidates",
  jobProfiles: "talentlens-job-profiles",
  selectedJobProfile: "talentlens-selected-job-profile",
  notifications: "talentlens-notifications",
  theme: "talentlens-theme",
  candidateQuery: "talentlens-candidate-query",
  candidateStatus: "talentlens-candidate-status",
  candidateView: "talentlens-candidate-view",
  candidateMinimumScore: "talentlens-candidate-min-score",
  candidateRole: "talentlens-candidate-role",
  candidateSort: "talentlens-candidate-sort",
  analyticsRange: "talentlens-analytics-range",
  analyticsRole: "talentlens-analytics-role",
  pipelineRange: "talentlens-pipeline-range",
  privacyAcknowledged: "talentlens-privacy-acknowledged",
  retentionDays: "talentlens-retention-days",
  lastBackupAt: "talentlens-last-backup-at",
} as const;

export const WORKSPACE_PREFERENCE_KEYS = [
  WORKSPACE_STORAGE_KEYS.theme,
  WORKSPACE_STORAGE_KEYS.candidateQuery,
  WORKSPACE_STORAGE_KEYS.candidateStatus,
  WORKSPACE_STORAGE_KEYS.candidateView,
  WORKSPACE_STORAGE_KEYS.candidateMinimumScore,
  WORKSPACE_STORAGE_KEYS.candidateRole,
  WORKSPACE_STORAGE_KEYS.candidateSort,
  WORKSPACE_STORAGE_KEYS.analyticsRange,
  WORKSPACE_STORAGE_KEYS.analyticsRole,
  WORKSPACE_STORAGE_KEYS.pipelineRange,
  WORKSPACE_STORAGE_KEYS.privacyAcknowledged,
  WORKSPACE_STORAGE_KEYS.retentionDays,
  WORKSPACE_STORAGE_KEYS.lastBackupAt,
] as const;

export type WorkspaceMigrationResult = {
  value: unknown;
  migrated: boolean;
};

export function migrateWorkspaceValue(
  key: string,
  value: unknown,
): WorkspaceMigrationResult {
  const nextValue = migrateByKey(key, value);

  return {
    value: nextValue,
    migrated: !isJsonEqual(value, nextValue),
  };
}

export function migrateWorkspacePreferences(
  preferences: Record<string, unknown>,
) {
  return Object.fromEntries(
    WORKSPACE_PREFERENCE_KEYS.map((key) => [
      key,
      migrateWorkspaceValue(key, preferences[key]).value,
    ]),
  );
}

function migrateByKey(key: string, value: unknown) {
  switch (key) {
    case WORKSPACE_STORAGE_KEYS.candidates:
      return migrateCandidates(value);
    case WORKSPACE_STORAGE_KEYS.jobProfiles:
      return migrateJobProfiles(value);
    case WORKSPACE_STORAGE_KEYS.selectedJobProfile:
      return typeof value === "string" && value ? value : defaultJobProfiles[0].id;
    case WORKSPACE_STORAGE_KEYS.notifications:
      return migrateNotifications(value);
    case WORKSPACE_STORAGE_KEYS.theme:
      return value === "dark" || value === "light" ? value : "light";
    case WORKSPACE_STORAGE_KEYS.candidateQuery:
    case WORKSPACE_STORAGE_KEYS.candidateRole:
    case WORKSPACE_STORAGE_KEYS.analyticsRole:
      return typeof value === "string" ? value : key.includes("role") ? "All roles" : "";
    case WORKSPACE_STORAGE_KEYS.candidateStatus:
      if (value === "All") return value;
      return isCandidateStatusLike(value)
        ? normalizeCandidateStatus(value)
        : "All";
    case WORKSPACE_STORAGE_KEYS.candidateView:
      if (value === "cards" || value === "table") return value;
      if (value === "list") return "table";
      return "table";
    case WORKSPACE_STORAGE_KEYS.candidateMinimumScore:
      return clampNumber(Number(value), 0, 100, 0);
    case WORKSPACE_STORAGE_KEYS.candidateSort:
      return isCandidateSort(value) ? value : "Score: high to low";
    case WORKSPACE_STORAGE_KEYS.analyticsRange:
    case WORKSPACE_STORAGE_KEYS.pipelineRange:
      return isInsightRange(value) ? value : "All time";
    case WORKSPACE_STORAGE_KEYS.privacyAcknowledged:
      return typeof value === "boolean" ? value : false;
    case WORKSPACE_STORAGE_KEYS.retentionDays:
      return migrateRetentionDays(value);
    case WORKSPACE_STORAGE_KEYS.lastBackupAt:
      return typeof value === "string" ? value : null;
    case WORKSPACE_SCHEMA_STORAGE_KEY:
      return WORKSPACE_SCHEMA_VERSION;
    default:
      return value;
  }
}

function migrateCandidates(value: unknown): Candidate[] {
  if (!Array.isArray(value)) return defaultCandidates;

  return value
    .map((candidate, index) => migrateCandidate(candidate, index))
    .filter((candidate): candidate is Candidate => Boolean(candidate));
}

function migrateCandidate(value: unknown, index: number): Candidate | null {
  if (!isRecord(value)) return null;

  const name = stringOr(value.name, stringOr(value.sourceFile, ""));
  const role = stringOr(value.role, stringOr(value.targetRole, "Candidate"));
  if (!name && role === "Candidate") return null;

  const status = normalizeCandidateStatus(value.status);
  const score = clampNumber(Number(value.score), 0, 100, 0);
  const id = Number.isFinite(Number(value.id)) ? Number(value.id) : index + 1;

  return {
    id,
    name: name || `Imported candidate ${id}`,
    role,
    targetRole: stringOr(value.targetRole, role),
    targetJobId: optionalString(value.targetJobId),
    location: stringOr(value.location, "Location not specified"),
    email: optionalString(value.email),
    phone: optionalString(value.phone),
    avatar: stringOr(value.avatar, getInitials(name || role)),
    color: stringOr(value.color, "violet"),
    score,
    skills: clampNumber(Number(value.skills), 0, 100, score),
    experience: clampNumber(Number(value.experience), 0, 100, score),
    education: clampNumber(Number(value.education), 0, 100, score),
    status,
    stage: normalizeCandidateStage(value.stage, status),
    submitted: stringOr(value.submitted, "Imported"),
    tags: stringArray(value.tags),
    strengths: stringArray(value.strengths),
    weaknesses: stringArray(value.weaknesses),
    sourceFile: optionalString(value.sourceFile),
    sourceFingerprint: optionalString(value.sourceFingerprint),
    summary: optionalString(value.summary),
    experienceYears: optionalNumber(value.experienceYears),
    educationText: optionalString(value.educationText),
    notes: stringOr(value.notes, ""),
    analyzedAt: optionalString(value.analyzedAt),
    sourceSize: optionalString(value.sourceSize),
    analysisConfidence: normalizeAnalysisConfidence(value.analysisConfidence),
    extractionConfidence: normalizeExtractionConfidence(value.extractionConfidence),
    extractionNotes: stringArray(value.extractionNotes),
    analysisVersion: stringOr(value.analysisVersion, ANALYSIS_VERSION),
    scoreReasons: stringArray(value.scoreReasons),
    matchedRequiredSkills: stringArray(value.matchedRequiredSkills),
    missingRequiredSkills: stringArray(value.missingRequiredSkills),
  };
}

function migrateJobProfiles(value: unknown): JobProfile[] {
  if (!Array.isArray(value)) return defaultJobProfiles;

  const profiles = value
    .map((profile, index) => migrateJobProfile(profile, index))
    .filter((profile): profile is JobProfile => Boolean(profile));

  return profiles.length ? profiles : defaultJobProfiles;
}

function migrateJobProfile(value: unknown, index: number): JobProfile | null {
  if (!isRecord(value)) return null;

  const name = stringOr(value.name, "");
  if (!name) return null;

  const now = new Date().toISOString();
  const requiredSkills = stringArray(value.requiredSkills);

  return {
    id: stringOr(value.id, createStableId(name, index)),
    name,
    description: stringOr(value.description, ""),
    requiredSkills,
    optionalSkills: stringArray(value.optionalSkills),
    requiredSkillStrictness: normalizeStrictness(value.requiredSkillStrictness),
    skillAliases: sanitizeSkillAliases(value.skillAliases),
    minimumExperienceYears: clampNumber(
      Number(value.minimumExperienceYears),
      0,
      60,
      0,
    ),
    educationKeywords: stringArray(value.educationKeywords),
    weights: migrateWeights(value.weights),
    createdAt: stringOr(value.createdAt, now),
    updatedAt: stringOr(value.updatedAt, now),
  };
}

function migrateNotifications(value: unknown): WorkspaceNotification[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((notification, index) => {
      if (!isRecord(notification)) return null;
      const href = stringOr(notification.href, "/");

      return {
        id: stringOr(notification.id, `notification-${index + 1}`),
        title: stringOr(notification.title, "Workspace update"),
        detail: stringOr(notification.detail, ""),
        href: href.startsWith("/") ? href : "/",
        read: typeof notification.read === "boolean" ? notification.read : false,
        createdAt: stringOr(notification.createdAt, new Date().toISOString()),
      } satisfies WorkspaceNotification;
    })
    .filter((notification): notification is WorkspaceNotification =>
      Boolean(notification),
    );
}

function migrateWeights(value: unknown): JobProfileWeights {
  if (!isRecord(value)) {
    return { skills: 50, experience: 30, education: 10, impact: 10 };
  }

  return normalizeWeights({
    skills: clampNumber(Number(value.skills), 0, 100, 50),
    experience: clampNumber(Number(value.experience), 0, 100, 30),
    education: clampNumber(Number(value.education), 0, 100, 10),
    impact: clampNumber(Number(value.impact), 0, 100, 10),
  });
}

function sanitizeSkillAliases(value: unknown): SkillAliases {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([skill, aliases]) => [skill, stringArray(aliases)] as const)
      .filter(([skill, aliases]) => skill.trim() && aliases.length),
  );
}

function normalizeStrictness(value: unknown): RequiredSkillStrictness {
  if (value === "flexible" || value === "strict") return value;
  return "balanced";
}

function normalizeCandidateStatus(value: unknown): CandidateStatus {
  if (value === "strong_match" || value === "Hire") return "strong_match";
  if (value === "low_evidence" || value === "Reject") return "low_evidence";
  return "needs_review";
}

function normalizeCandidateStage(
  value: unknown,
  status: CandidateStatus,
): CandidateStage {
  if (
    value === "New" ||
    value === "Review" ||
    value === "Interview" ||
    value === "Rejected"
  ) {
    return value;
  }
  if (status === "low_evidence") return "Rejected";
  if (status === "strong_match") return "Review";
  return "New";
}

function normalizeAnalysisConfidence(
  value: unknown,
): AnalysisConfidence | undefined {
  if (value === "High" || value === "Medium" || value === "Low") return value;
  return undefined;
}

function normalizeExtractionConfidence(
  value: unknown,
): ExtractionConfidence | undefined {
  if (value === "High" || value === "Medium" || value === "Low") return value;
  return undefined;
}

function migrateRetentionDays(value: unknown) {
  const retentionDays = Number(value);
  if (
    retentionDays === 0 ||
    retentionDays === 30 ||
    retentionDays === 90 ||
    retentionDays === 365
  ) {
    return retentionDays;
  }
  return 0;
}

function isCandidateStatus(value: unknown): value is CandidateStatus {
  return (
    value === "strong_match" ||
    value === "needs_review" ||
    value === "low_evidence"
  );
}

function isCandidateStatusLike(value: unknown) {
  return (
    isCandidateStatus(value) ||
    value === "Hire" ||
    value === "Review" ||
    value === "Reject"
  );
}

function isCandidateSort(value: unknown) {
  return (
    value === "Score: high to low" ||
    value === "Score: low to high" ||
    value === "Name: A to Z"
  );
}

function isInsightRange(value: unknown) {
  return (
    value === "Last 30 days" ||
    value === "Last 90 days" ||
    value === "All time"
  );
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function createStableId(name: string, index: number) {
  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "job-profile";

  return `${slug}-${index + 1}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
