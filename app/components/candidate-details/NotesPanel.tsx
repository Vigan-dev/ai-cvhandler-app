import type { Candidate } from "../../data/mock-data";

export function NotesPanel({
  candidate,
  onUpdateNotes,
}: {
  candidate: Candidate;
  onUpdateNotes: (notes: string) => void;
}) {
  return (
    <section
      className="card notes-card"
      id="candidate-panel-notes"
      role="tabpanel"
      aria-labelledby="candidate-tab-notes"
    >
      <div className="section-header">
        <div>
          <h2>Recruiter notes</h2>
          <p>Saved only in this browser</p>
        </div>
      </div>
      <label className="notes-field">
        <span className="sr-only">Notes for {candidate.name}</span>
        <textarea
          value={candidate.notes ?? ""}
          onChange={(event) => onUpdateNotes(event.target.value)}
          placeholder="Add interview observations, follow-up questions, or review notes..."
          maxLength={4000}
        />
        <small>{(candidate.notes ?? "").length}/4000</small>
      </label>
    </section>
  );
}
