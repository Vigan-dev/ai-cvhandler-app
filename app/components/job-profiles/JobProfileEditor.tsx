import type {
  JobProfile,
  RequiredSkillStrictness,
} from "../../data/job-profiles";
import { AliasEditor } from "./AliasEditor";
import type { JobDraft } from "./job-profile-draft";
import { ScoringPreview } from "./ScoringPreview";
import { WeightEditor } from "./WeightEditor";

export function JobProfileEditor({
  draft,
  draftProfile,
  weightTotal,
  message,
  onDraftChange,
  onSave,
  onRemove,
}: {
  draft: JobDraft;
  draftProfile: JobProfile | null;
  weightTotal: number;
  message: string;
  onDraftChange: (changes: Partial<JobDraft>) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  return (
    <section className="card job-profile-editor">
      <div className="form-grid">
        <label className="full">
          <span>Profile name</span>
          <input
            value={draft.name}
            onChange={(event) => onDraftChange({ name: event.target.value })}
            maxLength={100}
          />
        </label>
        <label className="full">
          <span>Description</span>
          <textarea
            value={draft.description}
            onChange={(event) =>
              onDraftChange({ description: event.target.value })
            }
            maxLength={600}
          />
        </label>
        <label className="full">
          <span>Required skills</span>
          <textarea
            value={draft.requiredSkills}
            onChange={(event) =>
              onDraftChange({ requiredSkills: event.target.value })
            }
            placeholder="React, TypeScript, Accessibility"
          />
          <small>Separate skills with commas or new lines.</small>
        </label>
        <label className="full">
          <span>Optional skills</span>
          <textarea
            value={draft.optionalSkills}
            onChange={(event) =>
              onDraftChange({ optionalSkills: event.target.value })
            }
          />
        </label>
        <label>
          <span>Required-skill strictness</span>
          <select
            value={draft.requiredSkillStrictness}
            onChange={(event) =>
              onDraftChange({
                requiredSkillStrictness: event.target
                  .value as RequiredSkillStrictness,
              })
            }
          >
            <option value="flexible">Flexible</option>
            <option value="balanced">Balanced</option>
            <option value="strict">Strict</option>
          </select>
          <small>Strict profiles reject candidates missing most required skills.</small>
        </label>
        <label>
          <span>Minimum experience</span>
          <input
            type="number"
            min="0"
            max="40"
            value={draft.minimumExperienceYears}
            onChange={(event) =>
              onDraftChange({
                minimumExperienceYears: Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          <span>Education keywords</span>
          <input
            value={draft.educationKeywords}
            onChange={(event) =>
              onDraftChange({ educationKeywords: event.target.value })
            }
            placeholder="Computer science, software engineering"
          />
        </label>
        <AliasEditor
          value={draft.skillAliases}
          onChange={(skillAliases) => onDraftChange({ skillAliases })}
        />
      </div>

      <WeightEditor
        draft={draft}
        weightTotal={weightTotal}
        onWeightChange={(field, value) => onDraftChange({ [field]: value })}
      />

      <ScoringPreview
        profile={draftProfile}
        previewText={draft.previewText}
        onPreviewTextChange={(previewText) => onDraftChange({ previewText })}
      />

      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      <div className="editor-actions">
        <button className="text-button danger-link" onClick={onRemove}>
          Delete profile
        </button>
        <button className="button primary" onClick={onSave}>
          Save profile
        </button>
      </div>
    </section>
  );
}
