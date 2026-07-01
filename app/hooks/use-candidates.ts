"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
} from "react";
import {
  ANALYSIS_VERSION,
  candidates as initialCandidates,
  type Candidate,
  type CandidateStage,
  type CandidateStatus,
} from "../data/mock-data";
import { usePersistentState } from "./use-persistent-state";
import { useRetentionDays } from "./use-workspace-settings";

export const CANDIDATES_STORAGE_KEY = "talentlens-candidates";

export function useCandidates() {
  const [retentionDays, , retentionHydrated] = useRetentionDays();
  const [candidates, setCandidates, hydrated] = usePersistentState<Candidate[]>(
    CANDIDATES_STORAGE_KEY,
    initialCandidates,
    { validate: isCandidateArray },
  );
  const setCompactCandidates = useCallback<
    Dispatch<SetStateAction<Candidate[]>>
  >(
    (action) => {
      setCandidates((current) => {
        const next =
          typeof action === "function"
            ? (action as (current: Candidate[]) => Candidate[])(current)
            : action;
        return next.map(compactCandidateForStorage);
      });
    },
    [setCandidates],
  );

  useEffect(() => {
    if (!hydrated || !retentionHydrated) return;

    const migrated = candidates
      .map(migrateCandidate)
      .filter((candidate) => !isExpired(candidate, retentionDays));
    const compacted = migrated.map(compactCandidateForStorage);

    if (JSON.stringify(compacted) !== JSON.stringify(candidates)) {
      setCompactCandidates(compacted);
    }
  }, [
    candidates,
    hydrated,
    retentionDays,
    retentionHydrated,
    setCompactCandidates,
  ]);

  return [candidates, setCompactCandidates, hydrated] as const;
}

function isExpired(candidate: Candidate, retentionDays: number) {
  if (retentionDays === 0 || !candidate.sourceFile || !candidate.analyzedAt) {
    return false;
  }

  const analyzedAt = Date.parse(candidate.analyzedAt);
  if (Number.isNaN(analyzedAt)) return false;

  return Date.now() - analyzedAt > retentionDays * 24 * 60 * 60 * 1000;
}

function migrateCandidate(candidate: Candidate): Candidate {
  if (candidate.sourceFile) {
    const status = normalizeCandidateStatus(candidate.status);

    return {
      ...candidate,
      status,
      targetRole: candidate.targetRole ?? candidate.role,
      stage: normalizeStage(candidate.stage, status),
      notes: candidate.notes ?? "",
      analyzedAt: candidate.analyzedAt ?? new Date().toISOString(),
      analysisVersion: candidate.analysisVersion ?? ANALYSIS_VERSION,
    };
  }

  const demo = initialCandidates.find((item) => item.id === candidate.id);
  if (!demo) {
    const status = normalizeCandidateStatus(candidate.status);

    return {
      ...candidate,
      status,
      targetRole: candidate.targetRole ?? candidate.role,
      stage: normalizeStage(candidate.stage, status),
      notes: candidate.notes ?? "",
      analysisVersion: candidate.analysisVersion ?? ANALYSIS_VERSION,
    };
  }

  return {
    ...demo,
    status: normalizeCandidateStatus(candidate.status),
    stage: normalizeStage(candidate.stage, demo.status),
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
    analysisVersion: candidate.analysisVersion ?? ANALYSIS_VERSION,
  };
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
        Array.isArray(candidate.tags) &&
        candidate.tags.every((item) => typeof item === "string") &&
        Array.isArray(candidate.strengths) &&
        candidate.strengths.every((item) => typeof item === "string") &&
        Array.isArray(candidate.weaknesses) &&
        candidate.weaknesses.every((item) => typeof item === "string"),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isScore(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isCandidateStatus(value: unknown): value is CandidateStatus {
  return (
    value === "strong_match" ||
    value === "needs_review" ||
    value === "low_evidence"
  );
}

function normalizeCandidateStatus(value: unknown): CandidateStatus {
  if (value === "strong_match" || value === "Hire") return "strong_match";
  if (value === "low_evidence" || value === "Reject") return "low_evidence";
  return "needs_review";
}

function normalizeStage(
  stage: CandidateStage | undefined,
  status: CandidateStatus,
): CandidateStage {
  if (
    stage === "New" ||
    stage === "Review" ||
    stage === "Interview" ||
    stage === "Rejected"
  ) {
    return stage;
  }

  if (status === "low_evidence") return "Rejected";
  if (status === "strong_match") return "Review";
  return "New";
}

function compactCandidateForStorage(candidate: Candidate): Candidate {
  return {
    ...candidate,
    status: normalizeCandidateStatus(candidate.status),
    summary: compactOptionalText(candidate.summary, 360),
    tags: compactStringArray(candidate.tags, 12, 80) ?? [],
    strengths: compactStringArray(candidate.strengths, 6, 180) ?? [],
    weaknesses: compactStringArray(candidate.weaknesses, 6, 180) ?? [],
    scoreReasons: compactStringArray(candidate.scoreReasons, 6, 240),
    extractionNotes: compactStringArray(candidate.extractionNotes, 4, 220),
    matchedRequiredSkills: compactStringArray(
      candidate.matchedRequiredSkills,
      40,
      80,
    ),
    missingRequiredSkills: compactStringArray(
      candidate.missingRequiredSkills,
      40,
      80,
    ),
  };
}

function compactStringArray(
  values: string[] | undefined,
  maxItems: number,
  maxLength: number,
) {
  return values
    ?.map((value) => value.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((value) => compactText(value, maxLength));
}

function compactOptionalText(value: string | undefined, maxLength: number) {
  return value ? compactText(value, maxLength) : undefined;
}

function compactText(value: string, maxLength: number) {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1)}...`;
}
