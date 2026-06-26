import type { Candidate } from "../../data/mock-data";
import { Icons } from "../icons";
import { Avatar, StatusBadge } from "../ui";

export function CandidateHero({
  candidate,
  onExport,
  onMoveToInterview,
}: {
  candidate: Candidate;
  onExport: () => void;
  onMoveToInterview: () => void;
}) {
  return (
    <section className="candidate-hero card">
      <div className="candidate-identity">
        <Avatar candidate={candidate} size="large" />
        <div>
          <div className="identity-title">
            <h1>{candidate.name}</h1>
            <StatusBadge status={candidate.status} />
          </div>
          <p>{candidate.role}</p>
          <div className="contact-row">
            <span>
              <Icons.location size={14} />
              {candidate.location}
            </span>
            {candidate.email && (
              <a href={`mailto:${candidate.email}`}>
                <Icons.mail size={14} />
                {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a href={`tel:${candidate.phone}`}>
                <Icons.phone size={14} />
                {candidate.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="candidate-hero-actions">
        <button className="button secondary" onClick={onExport}>
          <Icons.download size={17} /> Export analysis
        </button>
        <button
          className="button primary"
          onClick={onMoveToInterview}
          disabled={candidate.stage === "Interview"}
        >
          {candidate.stage === "Interview"
            ? "Interview stage"
            : "Move to interview"}{" "}
          <Icons.arrowRight size={17} />
        </button>
      </div>
    </section>
  );
}
