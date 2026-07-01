"use client";

import { useMemo } from "react";
import { useCandidates } from "./use-candidates";
import { usePersistentState } from "./use-persistent-state";
import {
  filterCandidatesByRange,
  getCandidateMetrics,
  getScoreBuckets,
  getStageBreakdown,
  getTopSkills,
  type InsightRange,
} from "../utils/candidate-insights";
import { downloadCsv } from "../utils/download-csv";
import { getMatchSignalLabel } from "../utils/match-signal-labels";

export const analyticsRanges: InsightRange[] = [
  "Last 30 days",
  "Last 90 days",
  "All time",
];

export function useAnalyticsData() {
  const [candidates] = useCandidates();
  const [range, setRange] = usePersistentState<InsightRange>(
    "talentlens-analytics-range",
    "All time",
    { validate: isInsightRange },
  );
  const [role, setRole] = usePersistentState(
    "talentlens-analytics-role",
    "All roles",
    { validate: (value): value is string => typeof value === "string" },
  );

  const roles = useMemo(
    () => [
      "All roles",
      ...new Set(
        candidates.map((candidate) => candidate.targetRole ?? candidate.role),
      ),
    ],
    [candidates],
  );
  const selectedRole = roles.includes(role) ? role : "All roles";

  const dateFiltered = useMemo(
    () => filterCandidatesByRange(candidates, range),
    [candidates, range],
  );
  const visibleCandidates = useMemo(
    () =>
      selectedRole === "All roles"
        ? dateFiltered
        : dateFiltered.filter(
            (candidate) =>
              (candidate.targetRole ?? candidate.role) === selectedRole,
          ),
    [dateFiltered, selectedRole],
  );
  const metrics = useMemo(
    () => getCandidateMetrics(visibleCandidates),
    [visibleCandidates],
  );
  const stages = useMemo(
    () => getStageBreakdown(visibleCandidates),
    [visibleCandidates],
  );
  const skills = useMemo(
    () => getTopSkills(visibleCandidates),
    [visibleCandidates],
  );
  const buckets = useMemo(
    () => getScoreBuckets(visibleCandidates),
    [visibleCandidates],
  );
  const ranked = useMemo(
    () =>
      [...visibleCandidates]
        .sort((left, right) => right.score - left.score)
        .slice(0, 5),
    [visibleCandidates],
  );
  const peakCount = useMemo(
    () => Math.max(0, ...buckets.map((item) => item.count)),
    [buckets],
  );
  const strongestSkill = skills[0];

  function exportReport() {
    downloadCsv("talentlens-analytics-report.csv", [
      ["Metric", "Value"],
      ["Range", range],
      ["Role", selectedRole],
      ["Candidates", metrics.total],
      [`${getMatchSignalLabel("strong_match")} profiles`, metrics.hireCount],
      [`${getMatchSignalLabel("needs_review")} profiles`, metrics.reviewCount],
      [`${getMatchSignalLabel("low_evidence")} profiles`, metrics.rejectCount],
      ["Average quality", metrics.averageScore.toFixed(1)],
      ["Interview stage", metrics.interviewCount],
    ]);
  }

  return {
    range,
    setRange,
    roles,
    selectedRole,
    setRole,
    metrics,
    stages,
    skills,
    buckets,
    ranked,
    peakCount,
    strongestSkill,
    exportReport,
  };
}

export type AnalyticsData = ReturnType<typeof useAnalyticsData>;

function isInsightRange(value: unknown): value is InsightRange {
  return (
    value === "Last 30 days" ||
    value === "Last 90 days" ||
    value === "All time"
  );
}
