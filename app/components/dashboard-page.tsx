"use client";

import Link from "next/link";
import { useCandidates } from "../hooks/use-candidates";
import { usePersistentState } from "../hooks/use-persistent-state";
import {
  filterCandidatesByRange,
  formatRelativeTime,
  getCandidateMetrics,
  getStageBreakdown,
  type InsightRange,
} from "../utils/candidate-insights";
import { downloadCsv } from "../utils/download-csv";
import { CandidateMiniRow, PageHeader, SectionHeader } from "./ui";
import { Icons } from "./icons";

const ranges: InsightRange[] = [
  "Last 30 days",
  "Last 90 days",
  "All time",
];

export function DashboardPage() {
  const [candidates] = useCandidates();
  const [range, setRange] = usePersistentState<InsightRange>(
    "talentlens-pipeline-range",
    "All time",
    { validate: isInsightRange },
  );
  const visibleCandidates = filterCandidatesByRange(candidates, range);
  const metrics = getCandidateMetrics(visibleCandidates);
  const stages = getStageBreakdown(visibleCandidates);
  const topCandidates = [...visibleCandidates]
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
  const recentCandidates = [...candidates]
    .sort(
      (left, right) =>
        Date.parse(right.analyzedAt ?? "") - Date.parse(left.analyzedAt ?? ""),
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Candidate profiles",
      value: metrics.total.toString(),
      detail: range.toLowerCase(),
      icon: Icons.file,
      tone: "violet",
    },
    {
      label: "Average match score",
      value: metrics.averageScore.toFixed(1),
      suffix: "/100",
      detail: "local matching",
      icon: Icons.sparkles,
      tone: "blue",
    },
    {
      label: "Hire recommendations",
      value: metrics.hireCount.toString(),
      detail: `${metrics.shortlistRate.toFixed(0)}% of profiles`,
      icon: Icons.users,
      tone: "green",
    },
    {
      label: "Estimated time saved",
      value: formatDuration(metrics.estimatedMinutesSaved),
      detail: "at 12 min per CV",
      icon: Icons.chart,
      tone: "orange",
    },
  ];

  function exportReport() {
    downloadCsv("talentlens-dashboard-report.csv", [
      ["Metric", "Value", "Context"],
      ...stats.map((stat) => [
        stat.label,
        `${stat.value}${stat.suffix ?? ""}`,
        stat.detail,
      ]),
    ]);
  }

  return (
    <>
      <PageHeader
        eyebrow={formatCurrentDate()}
        title="Local recruitment workspace"
        description="Candidate insights are calculated from the profiles stored in this browser."
        actions={
          <>
            <button className="button secondary" onClick={exportReport}>
              <Icons.download size={17} /> Export report
            </button>
            <Link className="button primary" href="/upload">
              <Icons.upload size={17} /> Upload CVs
            </Link>
          </>
        }
      />

      <section className="stats-grid" aria-label="Recruitment overview">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card" key={stat.label}>
              <div className={`stat-icon stat-${stat.tone}`}>
                <Icon size={20} />
              </div>
              <div className="stat-top">
                <span>{stat.label}</span>
              </div>
              <div className="stat-value">
                {stat.value}
                <small>{stat.suffix}</small>
              </div>
              <div className="stat-trend">{stat.detail}</div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-grid">
        <section className="card pipeline-card">
          <SectionHeader
            title="Candidate pipeline"
            subtitle={`Current workflow stages · ${range}`}
            action={
              <label className="inline-select">
                <span className="sr-only">Dashboard date range</span>
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
                <Icons.chevronDown size={14} />
              </label>
            }
          />
          <div className="pipeline-stage-list">
            {stages.map((stage) => (
              <div className="pipeline-stage-row" key={stage.label}>
                <div>
                  <span>{stage.label}</span>
                  <strong>{stage.value}</strong>
                </div>
                <i>
                  <b
                    style={{
                      width: `${stage.percent}%`,
                      background: stage.color,
                    }}
                  />
                </i>
                <small>{stage.percent}%</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card top-candidates-card">
          <SectionHeader
            title="Top candidates"
            subtitle="Highest local match scores"
            action={
              <Link href="/candidates" className="text-link">
                View all <Icons.arrowRight size={14} />
              </Link>
            }
          />
          <div className="candidate-mini-list">
            {topCandidates.length ? (
              topCandidates.map((candidate, index) => (
                <CandidateMiniRow
                  key={candidate.id}
                  candidate={candidate}
                  rank={index + 1}
                />
              ))
            ) : (
              <div className="empty-state compact">
                <p>No candidates in this date range.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card recent-card">
        <SectionHeader
          title="Recent local analyses"
          subtitle="Latest candidate profiles saved in this browser"
          action={
            <Link href="/upload" className="text-link">
              Analyze more <Icons.arrowRight size={14} />
            </Link>
          }
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Candidate</th>
                <th>Target role</th>
                <th>Analyzed</th>
                <th>Stage</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recentCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <span className="file-cell">
                      <i>
                        <Icons.file size={17} />
                      </i>
                      <strong>{candidate.sourceFile ?? "Demo profile"}</strong>
                    </span>
                  </td>
                  <td>{candidate.name}</td>
                  <td className="muted-cell">
                    {candidate.targetRole ?? candidate.role}
                  </td>
                  <td className="muted-cell">
                    {formatRelativeTime(candidate.analyzedAt)}
                  </td>
                  <td>
                    <span className="process-badge">
                      <i />
                      {candidate.stage}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="ghost-icon"
                      href={`/candidates/${candidate.id}`}
                      aria-label={`Open ${candidate.name}`}
                    >
                      <Icons.arrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}
