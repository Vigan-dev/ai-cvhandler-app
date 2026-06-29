"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCandidates } from "../hooks/use-candidates";
import { usePersistentState } from "../hooks/use-persistent-state";
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
import { Avatar, PageHeader, SectionHeader, StatusBadge } from "./ui";
import { Icons } from "./icons";

const ranges: InsightRange[] = [
  "Last 30 days",
  "Last 90 days",
  "All time",
];

export function AnalyticsPage() {
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
  const [showInsight, setShowInsight] = useState(false);
  const roles = [
    "All roles",
    ...new Set(
      candidates.map((candidate) => candidate.targetRole ?? candidate.role),
    ),
  ];
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
  const metrics = getCandidateMetrics(visibleCandidates);
  const stages = getStageBreakdown(visibleCandidates);
  const skills = getTopSkills(visibleCandidates);
  const buckets = getScoreBuckets(visibleCandidates);
  const ranked = [...visibleCandidates]
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  const peakCount = Math.max(0, ...buckets.map((item) => item.count));

  function exportReport() {
    downloadCsv("talentlens-analytics-report.csv", [
      ["Metric", "Value"],
      ["Range", range],
      ["Role", selectedRole],
      ["Candidates", metrics.total],
      [`${getMatchSignalLabel("Hire")} profiles`, metrics.hireCount],
      [`${getMatchSignalLabel("Review")} profiles`, metrics.reviewCount],
      [`${getMatchSignalLabel("Reject")} profiles`, metrics.rejectCount],
      ["Average quality", metrics.averageScore.toFixed(1)],
      ["Interview stage", metrics.interviewCount],
    ]);
  }

  const strongestSkill = skills[0];

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
                value={range}
                onChange={(event) =>
                  setRange(event.target.value as InsightRange)
                }
              >
                {ranges.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <Icons.chevronDown size={15} />
            </label>
            <button className="button secondary" onClick={exportReport}>
              <Icons.download size={17} /> Export report
            </button>
          </>
        }
      />

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

      <div className="analytics-grid">
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
              <strong>{metrics.hireCount}</strong> {getMatchSignalLabel("Hire")}
            </span>
            <span>
              <i className="mid-dot" />
              <strong>{metrics.reviewCount}</strong> {getMatchSignalLabel("Review")}
            </span>
            <span>
              <i className="low-dot" />
              <strong>{metrics.rejectCount}</strong> {getMatchSignalLabel("Reject")}
            </span>
          </div>
        </section>

        <section className="card skills-analytics-card">
          <SectionHeader
            title="Top skills detected"
            subtitle="Most common skills in the selected profiles"
          />
          <div className="top-skills-list">
            {skills.length ? (
              skills.map((skill, index) => (
                <div className="top-skill-row" key={skill.name}>
                  <span className="skill-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div>
                      <strong>{skill.name}</strong>
                      <span>
                        {skill.count} candidate{skill.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <i>
                      <b style={{ width: `${skill.percent}%` }} />
                    </i>
                  </div>
                  <small>{skill.percent}%</small>
                </div>
              ))
            ) : (
              <div className="empty-state compact">
                <p>No skills are available for this selection.</p>
              </div>
            )}
          </div>
        </section>

        <section className="card ranking-card">
          <SectionHeader
            title="Candidate ranking"
            subtitle="Highest local match scores"
            action={
              <label className="inline-select">
                <span className="sr-only">Filter ranking by target role</span>
                <select
                  value={selectedRole}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {roles.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <Icons.chevronDown size={14} />
              </label>
            }
          />
          <div className="ranking-list">
            {ranked.map((candidate, index) => (
              <Link
                href={`/candidates/${candidate.id}`}
                className="ranking-row"
                key={candidate.id}
              >
                <span className={`ranking-number ${index < 3 ? "top" : ""}`}>
                  {index + 1}
                </span>
                <Avatar candidate={candidate} size="small" />
                <div>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.targetRole ?? candidate.role}</small>
                </div>
                <StatusBadge status={candidate.status} />
                <strong className="ranking-score">
                  {candidate.score}
                  <small>/100</small>
                </strong>
              </Link>
            ))}
          </div>
        </section>
      </div>

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
          onClick={() => setShowInsight((shown) => !shown)}
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

function isInsightRange(value: unknown): value is InsightRange {
  return (
    value === "Last 30 days" ||
    value === "Last 90 days" ||
    value === "All time"
  );
}
