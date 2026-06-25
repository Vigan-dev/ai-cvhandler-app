"use client";

import { useEffect } from "react";
import {
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
  const state = usePersistentState<Candidate[]>(
    CANDIDATES_STORAGE_KEY,
    initialCandidates,
    { validate: isCandidateArray },
  );
  const [candidates, setCandidates, hydrated] = state;

  useEffect(() => {
    if (!hydrated || !retentionHydrated) return;

    const migrated = candidates
      .map(migrateCandidate)
      .filter((candidate) => !isExpired(candidate, retentionDays));
    if (JSON.stringify(migrated) !== JSON.stringify(candidates)) {
      setCandidates(migrated);
    }
  }, [
    candidates,
    hydrated,
    retentionDays,
    retentionHydrated,
    setCandidates,
  ]);

  return state;
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
    return {
      ...candidate,
      targetRole: candidate.targetRole ?? candidate.role,
      stage: normalizeStage(candidate.stage, candidate.status),
      notes: candidate.notes ?? "",
      analyzedAt: candidate.analyzedAt ?? new Date().toISOString(),
    };
  }

  const demo = initialCandidates.find((item) => item.id === candidate.id);
  if (!demo) {
    return {
      ...candidate,
      targetRole: candidate.targetRole ?? candidate.role,
      stage: normalizeStage(candidate.stage, candidate.status),
      notes: candidate.notes ?? "",
    };
  }

  return {
    ...demo,
    status: isCandidateStatus(candidate.status)
      ? candidate.status
      : demo.status,
    stage: normalizeStage(candidate.stage, demo.status),
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
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
  return value === "Hire" || value === "Review" || value === "Reject";
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

  if (status === "Reject") return "Rejected";
  if (status === "Hire") return "Review";
  return "New";
}
