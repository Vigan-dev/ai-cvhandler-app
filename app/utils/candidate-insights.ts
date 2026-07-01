import type { Candidate, CandidateStage } from "../data/mock-data.ts";

export type InsightRange = "Last 30 days" | "Last 90 days" | "All time";

export function filterCandidatesByRange(
  candidates: Candidate[],
  range: InsightRange,
  now = new Date(),
) {
  if (range === "All time") return candidates;

  const days = range === "Last 30 days" ? 30 : 90;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;

  return candidates.filter((candidate) => {
    if (!candidate.analyzedAt) return true;
    const analyzedAt = Date.parse(candidate.analyzedAt);
    return Number.isNaN(analyzedAt) || analyzedAt >= cutoff;
  });
}

export function getCandidateMetrics(candidates: Candidate[]) {
  const total = candidates.length;
  const averageScore = total
    ? candidates.reduce((sum, candidate) => sum + candidate.score, 0) / total
    : 0;
  const hireCount = countBy(
    candidates,
    (candidate) => candidate.status === "strong_match",
  );
  const interviewCount = countBy(
    candidates,
    (candidate) => candidate.stage === "Interview",
  );

  return {
    total,
    averageScore,
    hireCount,
    reviewCount: countBy(
      candidates,
      (candidate) => candidate.status === "needs_review",
    ),
    rejectCount: countBy(
      candidates,
      (candidate) => candidate.status === "low_evidence",
    ),
    interviewCount,
    shortlistRate: total ? (hireCount / total) * 100 : 0,
    estimatedMinutesSaved: total * 12,
  };
}

export function getTopSkills(candidates: Candidate[], limit = 5) {
  const counts = new Map<string, number>();

  candidates.forEach((candidate) => {
    new Set(candidate.tags).forEach((skill) => {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    });
  });

  const maximum = Math.max(1, ...counts.values());
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / maximum) * 100),
    }));
}

export function getScoreBuckets(candidates: Candidate[]) {
  const buckets = Array.from({ length: 8 }, (_, index) => ({
    label: `${index * 10 + 30}-${index * 10 + 39}`,
    count: 0,
  }));

  candidates.forEach((candidate) => {
    const index = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((candidate.score - 30) / 10)),
    );
    buckets[index].count += 1;
  });

  const maximum = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return buckets.map((bucket) => ({
    ...bucket,
    height: Math.max(6, Math.round((bucket.count / maximum) * 100)),
  }));
}

export function getStageBreakdown(candidates: Candidate[]) {
  const stages: Array<{ label: CandidateStage; color: string }> = [
    { label: "New", color: "var(--brand)" },
    { label: "Review", color: "#777386" },
    { label: "Interview", color: "#9895a2" },
    { label: "Rejected", color: "#c1bfc7" },
  ];
  const total = Math.max(1, candidates.length);

  return stages.map((stage) => {
    const value = countBy(
      candidates,
      (candidate) => candidate.stage === stage.label,
    );
    return {
      ...stage,
      value,
      percent: Math.round((value / total) * 100),
    };
  });
}

export function formatRelativeTime(
  timestamp: string | undefined,
  now = new Date(),
) {
  if (!timestamp) return "Unknown";
  const value = Date.parse(timestamp);
  if (Number.isNaN(value)) return "Unknown";

  const minutes = Math.max(0, Math.round((now.getTime() - value) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function countBy(
  candidates: Candidate[],
  predicate: (candidate: Candidate) => boolean,
) {
  return candidates.reduce(
    (count, candidate) => count + Number(predicate(candidate)),
    0,
  );
}
