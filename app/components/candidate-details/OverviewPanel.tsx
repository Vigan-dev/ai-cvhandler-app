import type { Candidate } from "../../data/mock-data";
import { Icons } from "../icons";

export function OverviewPanel({
  candidate,
  scoreLabel,
  targetRole,
}: {
  candidate: Candidate;
  scoreLabel: string;
  targetRole: string;
}) {
  return (
    <section
      className="card ai-summary-card"
      id="candidate-panel-overview"
      role="tabpanel"
      aria-labelledby="candidate-tab-overview"
    >
      <div className="ai-summary-heading">
        <div>
          <span className="ai-icon">
            <Icons.sparkles size={20} />
          </span>
          <div>
            <h2>Local candidate summary</h2>
            <p>Generated from text extracted in your browser</p>
          </div>
        </div>
        <div className="confidence-group" aria-label="Analysis confidence">
          <span className="confidence">Rule-based local analysis</span>
          <span className="confidence">
            Extraction: {candidate.extractionConfidence ?? "Medium"}
          </span>
        </div>
      </div>
      <p className="summary-copy">
        {candidate.summary ??
          `${candidate.name} is a ${scoreLabel.toLowerCase()} for ${targetRole}, with an overall score of ${candidate.score}.`}
      </p>
      <div className="summary-columns">
        <div>
          <h3>
            <span className="positive-icon">
              <Icons.check size={14} />
            </span>{" "}
            Key strengths
          </h3>
          <ul>
            {candidate.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>
            <span className="warning-icon">!</span> Considerations
          </h3>
          <ul>
            {candidate.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      {candidate.scoreReasons?.length ? (
        <div className="score-reasons">
          <div>
            <h3>Why this score</h3>
            <span className="confidence-pill">
              Scoring: {candidate.analysisConfidence ?? "Medium"} confidence
            </span>
          </div>
          <ul>
            {candidate.scoreReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {candidate.extractionNotes?.length ? (
            <div className="extraction-notes">
              <h3>Extraction notes</h3>
              <ul>
                {candidate.extractionNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
