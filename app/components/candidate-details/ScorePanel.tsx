import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
} from "../../data/mock-data";
import { getMatchSignalLabel } from "../../utils/match-signal-labels";
import { Icons } from "../icons";
import { ScoreRing } from "../ui";
import { WorkflowControls } from "./WorkflowControls";

export function ScorePanel({
  candidate,
  scoreLabel,
  targetRole,
  matchSignalCopy,
  onMoveToInterview,
  onMatchSignalChange,
  onStageChange,
  onRemoveCandidate,
}: {
  candidate: Candidate;
  scoreLabel: string;
  targetRole: string;
  matchSignalCopy: string;
  onMoveToInterview: () => void;
  onMatchSignalChange: (status: CandidateStatus) => void;
  onStageChange: (stage: CandidateStage) => void;
  onRemoveCandidate: () => void;
}) {
  return (
    <aside className="details-sidebar">
      <section className="card score-overview-card">
        <h2>Overall local score</h2>
        <div className="hero-score">
          <ScoreRing value={candidate.score} size={124} />
          <span>{scoreLabel}</span>
          <small>Review source material before taking action</small>
        </div>
        <div className="score-breakdown">
          <ScoreLine label="Skills match" value={candidate.skills} />
          <ScoreLine label="Experience" value={candidate.experience} />
          <ScoreLine label="Education" value={candidate.education} />
        </div>
      </section>

      <section
        className={`card match-signal-card match-signal-${candidate.status.toLowerCase()}`}
      >
        <span className="match-signal-icon">
          {candidate.status === "Reject" ? (
            <Icons.close size={22} />
          ) : candidate.status === "Review" ? (
            "!"
          ) : (
            <Icons.check size={22} />
          )}
        </span>
        <h2>Match signal: {getMatchSignalLabel(candidate.status)}</h2>
        <p>
          {matchSignalCopy} This signal should support, not replace, human
          review.
        </p>
        <WorkflowControls
          candidate={candidate}
          onMatchSignalChange={onMatchSignalChange}
          onStageChange={onStageChange}
        />
        <button
          className="button success"
          onClick={onMoveToInterview}
          disabled={candidate.stage === "Interview"}
        >
          {candidate.stage === "Interview"
            ? "Already in interview"
            : "Move to interview"}
        </button>
      </section>

      <section className="card source-card">
        <h2>Analysis details</h2>
        <dl>
          <div>
            <dt>Analyzed</dt>
            <dd>{candidate.submitted}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{candidate.sourceFile ?? "Demo data"}</dd>
          </div>
          <div>
            <dt>Target role</dt>
            <dd>{targetRole}</dd>
          </div>
          <div>
            <dt>Stage</dt>
            <dd>{candidate.stage}</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>Browser localStorage</dd>
          </div>
          <div>
            <dt>Score version</dt>
            <dd>{candidate.analysisVersion ?? "Unversioned"}</dd>
          </div>
        </dl>
        <button className="text-button danger-link" onClick={onRemoveCandidate}>
          Remove candidate
        </button>
      </section>
    </aside>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-line">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <i>
        <b style={{ width: `${value}%`, background: "var(--brand)" }} />
      </i>
    </div>
  );
}
