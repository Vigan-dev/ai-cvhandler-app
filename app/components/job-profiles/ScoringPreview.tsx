import { useMemo } from "react";
import type { JobProfile } from "../../data/job-profiles";
import { analyzeResumeText } from "../../utils/local-resume-analysis";

export function ScoringPreview({
  profile,
  previewText,
  onPreviewTextChange,
}: {
  profile: JobProfile | null;
  previewText: string;
  onPreviewTextChange: (text: string) => void;
}) {
  const scoringPreview = useMemo(() => {
    if (!profile) return null;
    try {
      return {
        candidate: analyzeResumeText(
          previewText,
          "job-profile-preview.txt",
          "Preview",
          profile,
          -1,
        ),
        error: "",
      };
    } catch (error) {
      return {
        candidate: null,
        error:
          error instanceof Error
            ? error.message
            : "Preview could not be scored.",
      };
    }
  }, [previewText, profile]);

  return (
    <div className="scoring-preview">
      <div className="section-header">
        <div>
          <h2>Scoring preview</h2>
          <p>
            Test this profile before saving. The preview uses the same local
            scoring version as uploads.
          </p>
        </div>
        {scoringPreview?.candidate && (
          <span
            className={`status-badge status-${scoringPreview.candidate.status.toLowerCase()}`}
          >
            <span aria-hidden="true" />
            {scoringPreview.candidate.status} ·{" "}
            {scoringPreview.candidate.score}
          </span>
        )}
      </div>
      <textarea
        value={previewText}
        onChange={(event) => onPreviewTextChange(event.target.value)}
        aria-label="CV scoring preview text"
      />
      {scoringPreview?.candidate ? (
        <div className="preview-result">
          <span>
            Matched required:{" "}
            <strong>
              {scoringPreview.candidate.matchedRequiredSkills?.join(", ") ||
                "None"}
            </strong>
          </span>
          <span>
            Missing required:{" "}
            <strong>
              {scoringPreview.candidate.missingRequiredSkills?.join(", ") ||
                "None"}
            </strong>
          </span>
          <span>
            Version: <strong>{scoringPreview.candidate.analysisVersion}</strong>
          </span>
        </div>
      ) : (
        <p className="form-message" role="status">
          {scoringPreview?.error}
        </p>
      )}
    </div>
  );
}
