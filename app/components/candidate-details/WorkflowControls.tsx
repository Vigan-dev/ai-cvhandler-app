import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
} from "../../data/mock-data";

export function WorkflowControls({
  candidate,
  onRecommendationChange,
  onStageChange,
}: {
  candidate: Candidate;
  onRecommendationChange: (status: CandidateStatus) => void;
  onStageChange: (stage: CandidateStage) => void;
}) {
  return (
    <div className="workflow-controls">
      <label>
        <span>Recommendation</span>
        <select
          value={candidate.status}
          onChange={(event) =>
            onRecommendationChange(event.target.value as CandidateStatus)
          }
        >
          <option value="Hire">Hire</option>
          <option value="Review">Review</option>
          <option value="Reject">Reject</option>
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
