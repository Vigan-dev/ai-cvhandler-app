"use client";

import { useState } from "react";
import { candidates, funnel, topSkills } from "../data/mock-data";
import { usePersistentState } from "../hooks/use-persistent-state";
import { downloadCsv } from "../utils/download-csv";
import { Avatar, PageHeader, SectionHeader, StatusBadge } from "./ui";
import { Icons } from "./icons";

export function AnalyticsPage() {
  const [range, setRange] = usePersistentState("talentlens-analytics-range", "Last 30 days");
  const [showInsight, setShowInsight] = useState(false);

  function exportReport() {
    downloadCsv("talentlens-analytics-report.csv", [
      ["Metric", "Value"],
      ["Range", range],
      ["CVs processed", 1248],
      ["Shortlist rate", "33.0%"],
      ["Average quality", 78.4],
      ["Average screening time", "24 sec"],
    ]);
  }
  return (
    <>
      <PageHeader
        eyebrow="Recruitment intelligence"
        title="Analytics"
        description="Understand candidate quality, pipeline health, and hiring trends."
        actions={
          <>
            <button className="select-button large" onClick={() => setRange(range === "Last 30 days" ? "Last 90 days" : "Last 30 days")}><span>{range}</span><Icons.chevronDown size={15} /></button>
            <button className="button secondary" onClick={exportReport}><Icons.download size={17} /> Export report</button>
          </>
        }
      />

      <section className="analytics-kpis">
        <article><span>CVs processed</span><strong>1,248</strong><small className="up"><Icons.arrowUp size={12} /> 12.5%</small></article>
        <article><span>Shortlist rate</span><strong>33.0%</strong><small className="up"><Icons.arrowUp size={12} /> 4.2%</small></article>
        <article><span>Average quality</span><strong>78.4</strong><small className="up"><Icons.arrowUp size={12} /> 2.8%</small></article>
        <article><span>Avg. time to screen</span><strong>24 sec</strong><small className="down">↓ 18.6%</small></article>
      </section>

      <div className="analytics-grid">
        <section className="card funnel-card">
          <SectionHeader title="Hiring funnel" subtitle="Candidate conversion by stage" action={<button className="ghost-icon"><Icons.more size={18} /></button>} />
          <div className="funnel-list">
            {funnel.map((item, index) => (
              <div className="funnel-row" key={item.label}>
                <div className="funnel-label"><span>{item.label}</span><strong>{item.value.toLocaleString()}</strong></div>
                <div className="funnel-track"><span style={{ width: `${item.percent}%`, background: item.color }} /></div>
                <small>{index === 0 ? "100%" : `${item.percent}% conversion`}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card distribution-card">
          <SectionHeader title="Score distribution" subtitle="AI match score across all candidates" action={<span className="metric-label">Avg. 78.4</span>} />
          <div className="histogram" role="img" aria-label="Most candidates scored between 70 and 90">
            {[18, 28, 46, 71, 100, 84, 56, 27].map((height, index) => (
              <div className="histogram-column" key={index}><span style={{ height: `${height}%` }} className={index === 4 ? "peak" : ""} /><small>{index * 10 + 30}–{index * 10 + 39}</small></div>
            ))}
          </div>
          <div className="distribution-summary">
            <span><i className="high-dot" /><strong>32%</strong> Excellent (85+)</span>
            <span><i className="mid-dot" /><strong>46%</strong> Good (70–84)</span>
            <span><i className="low-dot" /><strong>22%</strong> Below 70</span>
          </div>
        </section>

        <section className="card skills-analytics-card">
          <SectionHeader title="Top skills detected" subtitle="Most common skills in candidate profiles" action={<button className="text-link">View all</button>} />
          <div className="top-skills-list">
            {topSkills.map((skill, index) => (
              <div className="top-skill-row" key={skill.name}>
                <span className="skill-rank">0{index + 1}</span>
                <div><div><strong>{skill.name}</strong><span>{skill.count} candidates</span></div><i><b style={{ width: `${skill.percent}%` }} /></i></div>
                <small>{skill.percent}%</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card ranking-card">
          <SectionHeader title="Candidate ranking" subtitle="Top performers by overall AI score" action={<button className="select-button">All roles <Icons.chevronDown size={14} /></button>} />
          <div className="ranking-list">
            {candidates.slice(0, 5).map((candidate, index) => (
              <div className="ranking-row" key={candidate.id}>
                <span className={`ranking-number ${index < 3 ? "top" : ""}`}>{index + 1}</span>
                <Avatar candidate={candidate} size="small" />
                <div><strong>{candidate.name}</strong><small>{candidate.role}</small></div>
                <StatusBadge status={candidate.status} />
                <strong className="ranking-score">{candidate.score}<small>/100</small></strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card insight-banner">
        <span className="insight-icon"><Icons.sparkles size={23} /></span>
        <div><span>AI INSIGHT</span><h2>Your candidate quality is trending up</h2><p>Average match scores improved by 4.2% this month, driven by stronger experience alignment in design and engineering roles.</p></div>
        <button className="button secondary" onClick={() => setShowInsight((shown) => !shown)}>{showInsight ? "Hide details" : "View detailed insight"} <Icons.arrowRight size={16} /></button>
      </section>
      {showInsight && (
        <section className="card insight-detail">
          <strong>What changed</strong>
          <p>Engineering and product candidates drove the improvement. Profiles scoring above 85 increased while average screening time fell to 24 seconds.</p>
        </section>
      )}
    </>
  );
}
