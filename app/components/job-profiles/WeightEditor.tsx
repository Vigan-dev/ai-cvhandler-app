import type { JobDraft } from "./job-profile-draft";

type WeightField =
  | "skillsWeight"
  | "experienceWeight"
  | "educationWeight"
  | "impactWeight";

const weightFields: { field: WeightField; label: string }[] = [
  { field: "skillsWeight", label: "Skills" },
  { field: "experienceWeight", label: "Experience" },
  { field: "educationWeight", label: "Education" },
  { field: "impactWeight", label: "Measured impact" },
];

export function WeightEditor({
  draft,
  weightTotal,
  onWeightChange,
}: {
  draft: JobDraft;
  weightTotal: number;
  onWeightChange: (field: WeightField, value: number) => void;
}) {
  return (
    <div className="weight-editor">
      <div className="section-header">
        <div>
          <h2>Score weights</h2>
          <p>
            Current total: {weightTotal}%. Values are normalized when saved.
          </p>
        </div>
      </div>
      {weightFields.map(({ field, label }) => (
        <label key={field}>
          <span>
            {label} <strong>{draft[field]}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={draft[field]}
            onChange={(event) => onWeightChange(field, Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );
}
