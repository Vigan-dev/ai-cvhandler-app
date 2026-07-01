"use client";

import { useState } from "react";
import {
  analyticsRanges,
  useAnalyticsData,
} from "../hooks/use-analytics-data";
import type { InsightRange } from "../utils/candidate-insights";
import { AnalyticsKpis } from "./analytics/AnalyticsKpis";
import { CandidateRankingCard } from "./analytics/CandidateRankingCard";
import { InsightBanner } from "./analytics/InsightBanner";
import { ScoreDistributionCard } from "./analytics/ScoreDistributionCard";
import { TopSkillsCard } from "./analytics/TopSkillsCard";
import { WorkflowStagesCard } from "./analytics/WorkflowStagesCard";
import { Icons } from "./icons";
import { PageHeader } from "./ui";

export function AnalyticsPage() {
  const analytics = useAnalyticsData();
  const [showInsight, setShowInsight] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Local recruitment intelligence"
        title="Analytics"
        description="All metrics are derived from candidate profiles stored in this browser."
        actions={
          <>
            <label className="inline-select large">
              <span className="sr-only">Analytics date range</span>
              <select
                value={analytics.range}
                onChange={(event) =>
                  analytics.setRange(event.target.value as InsightRange)
                }
              >
                {analyticsRanges.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <Icons.chevronDown size={15} />
            </label>
            <button className="button secondary" onClick={analytics.exportReport}>
              <Icons.download size={17} /> Export report
            </button>
          </>
        }
      />

      <AnalyticsKpis metrics={analytics.metrics} />

      <div className="analytics-grid">
        <WorkflowStagesCard stages={analytics.stages} />
        <ScoreDistributionCard
          buckets={analytics.buckets}
          metrics={analytics.metrics}
          peakCount={analytics.peakCount}
        />
        <TopSkillsCard skills={analytics.skills} />
        <CandidateRankingCard
          ranked={analytics.ranked}
          roles={analytics.roles}
          selectedRole={analytics.selectedRole}
          setRole={analytics.setRole}
        />
      </div>

      <InsightBanner
        showInsight={showInsight}
        strongestSkill={analytics.strongestSkill}
        onToggleInsight={() => setShowInsight((shown) => !shown)}
      />
    </>
  );
}
