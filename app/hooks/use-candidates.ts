"use client";

import { useEffect } from "react";
import { candidates as initialCandidates, type Candidate } from "../data/mock-data";
import { usePersistentState } from "./use-persistent-state";

export const CANDIDATES_STORAGE_KEY = "talentlens-candidates";

export function useCandidates() {
  const state = usePersistentState<Candidate[]>(
    CANDIDATES_STORAGE_KEY,
    initialCandidates,
  );
  const [candidates, setCandidates, hydrated] = state;

  useEffect(() => {
    if (!hydrated) return;

    const migrated = candidates.map((candidate) => {
      if (candidate.sourceFile) return candidate;
      const currentDemo = initialCandidates.find(
        (item) => item.id === candidate.id,
      );
      return currentDemo ? { ...currentDemo, ...candidate } : candidate;
    });

    const needsMigration = migrated.some(
      (candidate, index) =>
        candidate.targetRole !== candidates[index]?.targetRole ||
        candidate.email !== candidates[index]?.email ||
        candidate.summary !== candidates[index]?.summary ||
        candidate.experienceYears !== candidates[index]?.experienceYears,
    );

    if (needsMigration) setCandidates(migrated);
  }, [candidates, hydrated, setCandidates]);

  return state;
}
