import Link from "next/link";
import type { Candidate, CandidateStatus } from "../data/mock-data";
import { Icons } from "./icons";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {status}
    </span>
  );
}

export function Avatar({
  candidate,
  size = "medium",
}: {
  candidate: Candidate;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span
      className={`avatar avatar-${candidate.color} avatar-${size}`}
      aria-hidden="true"
    >
      {candidate.avatar}
    </span>
  );
}

export function ScoreRing({
  value,
  size = 56,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const tone =
    normalizedValue >= 85
      ? "high"
      : normalizedValue >= 70
        ? "medium"
        : "low";
  return (
    <div
      className={`score-ring score-${tone}`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--score-color) ${normalizedValue * 3.6}deg, var(--track) 0deg)`,
      }}
      role="img"
      aria-label={`${label ?? "Score"}: ${normalizedValue} out of 100`}
    >
      <span aria-hidden="true">{normalizedValue}</span>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CandidateMiniRow({ candidate, rank }: { candidate: Candidate; rank?: number }) {
  return (
    <Link className="candidate-mini-row" href={`/candidates/${candidate.id}`}>
      {rank && <span className="rank-number">{rank}</span>}
      <Avatar candidate={candidate} size="small" />
      <span className="candidate-mini-copy">
        <strong>{candidate.name}</strong>
        <small>{candidate.role}</small>
      </span>
      <ScoreRing value={candidate.score} size={44} />
      <Icons.arrowRight size={17} className="row-arrow" />
    </Link>
  );
}
