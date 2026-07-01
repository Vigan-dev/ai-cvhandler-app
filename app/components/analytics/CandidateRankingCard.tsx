import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { AnalyticsData } from "../../hooks/use-analytics-data";
import { Icons } from "../icons";
import { Avatar, SectionHeader, StatusBadge } from "../ui";

export function CandidateRankingCard({
  ranked,
  roles,
  selectedRole,
  setRole,
}: {
  ranked: AnalyticsData["ranked"];
  roles: AnalyticsData["roles"];
  selectedRole: AnalyticsData["selectedRole"];
  setRole: Dispatch<SetStateAction<string>>;
}) {
  return (
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
  );
}
