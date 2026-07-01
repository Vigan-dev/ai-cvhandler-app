import type { AnalyticsData } from "../../hooks/use-analytics-data";
import { Icons } from "../icons";

export function InsightBanner({
  showInsight,
  strongestSkill,
  onToggleInsight,
}: {
  showInsight: boolean;
  strongestSkill: AnalyticsData["strongestSkill"];
  onToggleInsight: () => void;
}) {
  return (
    <>
      <section className="card insight-banner">
        <span className="insight-icon">
          <Icons.sparkles size={23} />
        </span>
        <div>
          <span>LOCAL INSIGHT</span>
          <h2>
            {strongestSkill
              ? `${strongestSkill.name} is the strongest recurring skill`
              : "Analyze CVs to generate local insights"}
          </h2>
          <p>
            {strongestSkill
              ? `${strongestSkill.count} selected candidate profiles mention ${strongestSkill.name}.`
              : "No candidate skills are available for the selected filters."}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={onToggleInsight}
          aria-expanded={showInsight}
        >
          {showInsight ? "Hide details" : "View details"}{" "}
          <Icons.arrowRight size={16} />
        </button>
      </section>
      {showInsight && (
        <section className="card insight-detail">
          <strong>How this is calculated</strong>
          <p>
            Skill frequency, scores, match signals, and workflow stages are
            aggregated from the locally stored candidate records matching the
            selected date range and role.
          </p>
        </section>
      )}
    </>
  );
}
