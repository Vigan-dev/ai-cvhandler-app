import type { AnalyticsData } from "../../hooks/use-analytics-data";
import { getMatchSignalLabel } from "../../utils/match-signal-labels";
import { SectionHeader } from "../ui";

export function ScoreDistributionCard({
  buckets,
  metrics,
  peakCount,
}: {
  buckets: AnalyticsData["buckets"];
  metrics: AnalyticsData["metrics"];
  peakCount: AnalyticsData["peakCount"];
}) {
  return (
    <section className="card distribution-card">
      <SectionHeader
        title="Score distribution"
        subtitle="Local match scores"
        action={
          <span className="metric-label">
            Avg. {metrics.averageScore.toFixed(1)}
          </span>
        }
      />
      <div
        className="histogram"
        role="img"
        aria-label="Distribution of candidate match scores"
      >
        {buckets.map((bucket) => (
          <div className="histogram-column" key={bucket.label}>
            <span
              style={{ height: `${bucket.height}%` }}
              className={
                peakCount > 0 && bucket.count === peakCount ? "peak" : ""
              }
            />
            <small>{bucket.label}</small>
          </div>
        ))}
      </div>
      <div className="distribution-summary">
        <span>
          <i className="high-dot" />
          <strong>{metrics.hireCount}</strong> {getMatchSignalLabel("strong_match")}
        </span>
        <span>
          <i className="mid-dot" />
          <strong>{metrics.reviewCount}</strong>{" "}
          {getMatchSignalLabel("needs_review")}
        </span>
        <span>
          <i className="low-dot" />
          <strong>{metrics.rejectCount}</strong> {getMatchSignalLabel("low_evidence")}
        </span>
      </div>
    </section>
  );
}
