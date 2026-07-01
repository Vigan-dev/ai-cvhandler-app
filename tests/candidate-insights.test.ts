import assert from "node:assert/strict";
import test from "node:test";
import { candidates } from "../app/data/mock-data.ts";
import {
  filterCandidatesByRange,
  formatRelativeTime,
  getCandidateMetrics,
  getScoreBuckets,
  getStageBreakdown,
  getTopSkills,
} from "../app/utils/candidate-insights.ts";

test("candidate metrics are derived from current candidate data", () => {
  const metrics = getCandidateMetrics(candidates);

  assert.equal(metrics.total, candidates.length);
  assert.equal(
    metrics.hireCount,
    candidates.filter((candidate) => candidate.status === "strong_match").length,
  );
  assert.equal(
    metrics.interviewCount,
    candidates.filter((candidate) => candidate.stage === "Interview").length,
  );
  assert.ok(metrics.averageScore > 0);
});

test("analytics helpers preserve totals", () => {
  const buckets = getScoreBuckets(candidates);
  const stages = getStageBreakdown(candidates);
  const topSkills = getTopSkills(candidates, 3);

  assert.equal(
    buckets.reduce((total, bucket) => total + bucket.count, 0),
    candidates.length,
  );
  assert.equal(
    stages.reduce((total, stage) => total + stage.value, 0),
    candidates.length,
  );
  assert.equal(topSkills.length, 3);
});

test("date filtering and relative labels use the supplied clock", () => {
  const now = new Date("2026-06-25T12:00:00.000Z");
  const recent = filterCandidatesByRange(candidates, "Last 30 days", now);

  assert.equal(recent.length, candidates.length);
  assert.equal(
    formatRelativeTime("2026-06-25T11:30:00.000Z", now),
    "30 min ago",
  );
});
