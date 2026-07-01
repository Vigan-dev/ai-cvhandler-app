import type { AnalyticsData } from "../../hooks/use-analytics-data";
import { SectionHeader } from "../ui";

export function WorkflowStagesCard({
  stages,
}: {
  stages: AnalyticsData["stages"];
}) {
  return (
    <section className="card funnel-card">
      <SectionHeader
        title="Workflow stages"
        subtitle="Current candidate pipeline"
      />
      <div className="funnel-list">
        {stages.map((item) => (
          <div className="funnel-row" key={item.label}>
            <div className="funnel-label">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="funnel-track">
              <span
                style={{
                  width: `${item.percent}%`,
                  background: item.color,
                }}
              />
            </div>
            <small>{item.percent}% of profiles</small>
          </div>
        ))}
      </div>
    </section>
  );
}
