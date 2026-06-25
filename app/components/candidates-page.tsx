"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CandidateStatus } from "../data/mock-data";
import { useCandidates } from "../hooks/use-candidates";
import { usePersistentState } from "../hooks/use-persistent-state";
import { downloadCsv } from "../utils/download-csv";
import { Avatar, PageHeader, ScoreRing, StatusBadge } from "./ui";
import { Icons } from "./icons";

export function CandidatesPage() {
  const [candidates] = useCandidates();
  const [query, setQuery] = usePersistentState(
    "talentlens-candidate-query",
    "",
    { validate: (value): value is string => typeof value === "string" },
  );
  const [status, setStatus] = usePersistentState<"All" | CandidateStatus>(
    "talentlens-candidate-status",
    "All",
    { validate: isStatusFilter },
  );
  const [view, setView] = usePersistentState<"table" | "cards">(
    "talentlens-candidate-view",
    "table",
    { validate: (value): value is "table" | "cards" => value === "table" || value === "cards" },
  );
  const [minimumScore, setMinimumScore] = usePersistentState(
    "talentlens-candidate-min-score",
    0,
    {
      validate: (value): value is number =>
        typeof value === "number" && value >= 0 && value <= 100,
    },
  );
  const [role, setRole] = usePersistentState(
    "talentlens-candidate-role",
    "All roles",
    { validate: (value): value is string => typeof value === "string" },
  );
  const [sort, setSort] = usePersistentState(
    "talentlens-candidate-sort",
    "Score: high to low",
    { validate: isSortOption },
  );
  const [jobContext] = usePersistentState("talentlens-job-context", "Senior Product Designer");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const roles = [
    "All roles",
    ...new Set(
      candidates.map((candidate) => candidate.targetRole ?? candidate.role),
    ),
  ];
  const selectedRole = roles.includes(role) ? role : "All roles";

  const filtered = useMemo(
    () => {
      const results = candidates.filter(
        (candidate) =>
          (status === "All" || candidate.status === status) &&
          (selectedRole === "All roles" ||
            (candidate.targetRole ?? candidate.role) === selectedRole) &&
          candidate.score >= minimumScore &&
          `${candidate.name} ${candidate.role} ${candidate.targetRole ?? ""} ${candidate.location} ${candidate.tags.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      );

      return results.sort((a, b) => {
        if (sort === "Score: low to high") return a.score - b.score;
        if (sort === "Name: A to Z") return a.name.localeCompare(b.name);
        return b.score - a.score;
      });
    },
    [candidates, minimumScore, query, selectedRole, sort, status],
  );

  const activeAdvancedFilters =
    Number(minimumScore > 0) + Number(selectedRole !== "All roles");
  const topScore = Math.max(0, ...candidates.map((candidate) => candidate.score));
  const hireCount = candidates.filter((candidate) => candidate.status === "Hire").length;
  const reviewCount = candidates.filter((candidate) => candidate.status === "Review").length;
  const averageScore = candidates.length
    ? (
        candidates.reduce((total, candidate) => total + candidate.score, 0) /
        candidates.length
      ).toFixed(1)
    : "0.0";

  function clearFilters() {
    setQuery("");
    setStatus("All");
    setMinimumScore(0);
    setRole("All roles");
    setSort("Score: high to low");
  }

  function exportCandidates() {
    downloadCsv("talentlens-candidates.csv", [
      ["Candidate", "Current role", "Target role", "Location", "Score", "Skills", "Experience", "Education", "Recommendation", "Stage"],
      ...filtered.map((candidate) => [
        candidate.name,
        candidate.role,
        candidate.targetRole ?? candidate.role,
        candidate.location,
        candidate.score,
        candidate.skills,
        candidate.experience,
        candidate.education,
        candidate.status,
        candidate.stage,
      ]),
    ]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Candidate intelligence"
        title="Candidate results"
        description={`${candidates.length} candidates stored locally. Current matching profile: ${jobContext}.`}
        actions={
          <>
            <button className="button secondary" onClick={exportCandidates} disabled={filtered.length === 0}><Icons.download size={17} /> Export</button>
            <Link href="/upload" className="button primary"><Icons.plus size={17} /> Add candidates</Link>
          </>
        }
      />

      <section className="candidate-summary-strip">
        <div><span>Top match</span><strong>{topScore}</strong><small>/100</small></div>
        <i />
        <div><span>Recommended to hire</span><strong>{hireCount}</strong><small>candidates</small></div>
        <i />
        <div><span>Average score</span><strong>{averageScore}</strong><small>/100</small></div>
        <i />
        <div><span>Needs review</span><strong>{reviewCount}</strong><small>candidates</small></div>
      </section>

      <section className="card candidates-card">
        <div className="candidate-toolbar">
          <label className="candidate-search"><Icons.search size={17} /><span className="sr-only">Search candidate results</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidates..." /></label>
          <div className="filter-tabs" aria-label="Filter by recommendation">
            {["All", "Hire", "Review", "Reject"].map((item) => (
              <button key={item} onClick={() => setStatus(item as "All" | CandidateStatus)} className={status === item ? "active" : ""}>{item}{item === "All" && <span>{candidates.length}</span>}</button>
            ))}
          </div>
          <button
            className={`button secondary filter-button ${filtersOpen ? "active" : ""}`}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="advanced-candidate-filters"
          >
            <Icons.filter size={16} /> Filters
            {activeAdvancedFilters > 0 && <span className="filter-count">{activeAdvancedFilters}</span>}
          </button>
          <div className="view-toggle" role="group" aria-label="Candidate layout">
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} aria-label="Table view" aria-pressed={view === "table"}><Icons.menu size={17} /></button>
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} aria-label="Card view" aria-pressed={view === "cards"}><Icons.grid size={16} /></button>
          </div>
        </div>
        {filtersOpen && (
          <div className="advanced-filters" id="advanced-candidate-filters">
            <label>
              <span>Minimum local score <strong>{minimumScore}</strong></span>
              <input type="range" min="0" max="95" step="5" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))} />
            </label>
            <label>
              <span>Target role</span>
              <select value={selectedRole} onChange={(event) => setRole(event.target.value)}>
                {roles.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>Score: high to low</option>
                <option>Score: low to high</option>
                <option>Name: A to Z</option>
              </select>
            </label>
            <button className="text-button" onClick={clearFilters}>Reset filters</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <span><Icons.search size={26} /></span>
            <h2>No candidates found</h2>
            <p>Try a different search term or clear your filters.</p>
            <button className="button secondary" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : view === "table" ? (
          <div className="table-wrap">
            <table className="data-table candidate-table">
              <thead><tr><th>Candidate</th><th>Local score</th><th>Skill match</th><th>Experience</th><th>Education</th><th>Recommendation</th><th>Stage</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {filtered.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <Link className="candidate-cell" href={`/candidates/${candidate.id}`}>
                        <Avatar candidate={candidate} size="small" />
                        <span><strong>{candidate.name}</strong><small>{candidate.role} · {candidate.location}</small></span>
                      </Link>
                    </td>
                    <td><div className="score-cell"><ScoreRing value={candidate.score} size={42} /><strong>{candidate.score}</strong><small>/100</small></div></td>
                    <td><MatchBar value={candidate.skills} /></td>
                    <td><MatchBar value={candidate.experience} /></td>
                    <td><MatchBar value={candidate.education} /></td>
                    <td><StatusBadge status={candidate.status} /></td>
                    <td><span className="stage-label">{candidate.stage}</span></td>
                    <td><Link className="ghost-icon" href={`/candidates/${candidate.id}`} aria-label={`Open ${candidate.name}`}><Icons.arrowRight size={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="candidate-cards-grid">
            {filtered.map((candidate) => (
              <Link href={`/candidates/${candidate.id}`} className="candidate-result-card" key={candidate.id}>
                <div className="candidate-result-top"><Avatar candidate={candidate} /><ScoreRing value={candidate.score} size={56} /></div>
                <h2>{candidate.name}</h2><p>{candidate.role}</p>
                <div className="tag-row">{candidate.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="card-score-grid"><span>Skills <strong>{candidate.skills}%</strong></span><span>Experience <strong>{candidate.experience}%</strong></span><span>Education <strong>{candidate.education}%</strong></span></div>
                <div className="candidate-result-footer"><StatusBadge status={candidate.status} /><span>View profile <Icons.arrowRight size={14} /></span></div>
              </Link>
            ))}
          </div>
        )}

        <div className="table-footer"><span>Showing {filtered.length} of {candidates.length} candidates</span></div>
      </section>
    </>
  );
}

function MatchBar({ value }: { value: number }) {
  return <div className="match-bar"><span>{value}%</span><i><b style={{ width: `${value}%` }} /></i></div>;
}

function isStatusFilter(value: unknown): value is "All" | CandidateStatus {
  return (
    value === "All" ||
    value === "Hire" ||
    value === "Review" ||
    value === "Reject"
  );
}

function isSortOption(value: unknown): value is string {
  return (
    value === "Score: high to low" ||
    value === "Score: low to high" ||
    value === "Name: A to Z"
  );
}
