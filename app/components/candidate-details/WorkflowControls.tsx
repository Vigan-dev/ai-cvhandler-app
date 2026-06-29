import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
} from "../../data/mock-data";
import {
  getMatchSignalLabel,
  matchSignalOptions,
} from "../../utils/match-signal-labels";

export function WorkflowControls({
  candidate,
  onMatchSignalChange,
  onStageChange,
}: {
  candidate: Candidate;
  onMatchSignalChange: (status: CandidateStatus) => void;
  onStageChange: (stage: CandidateStage) => void;
}) {
  return (
    <div className="workflow-controls">
      <label>
        <span>Match signal</span>
        <select
          value={candidate.status}
          onChange={(event) =>
            onMatchSignalChange(event.target.value as CandidateStatus)
          }
        >
          {matchSignalOptions.map((status) => (
            <option value={status} key={status}>
              {getMatchSignalLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Pipeline stage</span>
        <select
          value={candidate.stage}
          onChange={(event) =>
            onStageChange(event.target.value as CandidateStage)
          }
        >
          <option value="New">New</option>
          <option value="Review">Review</option>
          <option value="Interview">Interview</option>
          <option value="Rejected">Rejected</option>
        </select>
      </label>
    </div>
  );
}
