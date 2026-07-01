import type { AnalyticsData } from "../../hooks/use-analytics-data";

export function AnalyticsKpis({
  metrics,
}: {
  metrics: AnalyticsData["metrics"];
}) {
  return (
    <section className="analytics-kpis">
      <article>
        <span>Profiles analyzed</span>
        <strong>{metrics.total}</strong>
      </article>
      <article>
        <span>Strong match rate</span>
        <strong>{metrics.shortlistRate.toFixed(1)}%</strong>
      </article>
      <article>
        <span>Average quality</span>
        <strong>{metrics.averageScore.toFixed(1)}</strong>
      </article>
      <article>
        <span>Interview stage</span>
        <strong>{metrics.interviewCount}</strong>
      </article>
    </section>
  );
}
