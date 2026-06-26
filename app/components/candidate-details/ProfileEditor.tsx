import type { Candidate } from "../../data/mock-data";

export function ProfileEditor({
  candidate,
  onUpdate,
}: {
  candidate: Candidate;
  onUpdate: (changes: Partial<Candidate>) => void;
}) {
  return (
    <section
      className="card profile-editor-card"
      id="candidate-panel-profile"
      role="tabpanel"
      aria-labelledby="candidate-tab-profile"
    >
      <div className="section-header">
        <div>
          <h2>Correct candidate profile</h2>
          <p>Manual changes are saved locally and do not alter the source CV.</p>
        </div>
      </div>
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            value={candidate.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            maxLength={120}
          />
        </label>
        <label>
          <span>Current role</span>
          <input
            value={candidate.role}
            onChange={(event) => onUpdate({ role: event.target.value })}
            maxLength={160}
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={candidate.email ?? ""}
            onChange={(event) =>
              onUpdate({ email: event.target.value || undefined })
            }
            maxLength={200}
          />
        </label>
        <label>
          <span>Phone</span>
          <input
            type="tel"
            value={candidate.phone ?? ""}
            onChange={(event) =>
              onUpdate({ phone: event.target.value || undefined })
            }
            maxLength={60}
          />
        </label>
        <label>
          <span>Location</span>
          <input
            value={candidate.location}
            onChange={(event) => onUpdate({ location: event.target.value })}
            maxLength={160}
          />
        </label>
        <label>
          <span>Experience years</span>
          <input
            type="number"
            min="0"
            max="60"
            value={candidate.experienceYears ?? 0}
            onChange={(event) =>
              onUpdate({
                experienceYears: Math.max(0, Number(event.target.value)),
              })
            }
          />
        </label>
        <label className="full">
          <span>Education</span>
          <input
            value={candidate.educationText ?? ""}
            onChange={(event) =>
              onUpdate({ educationText: event.target.value || undefined })
            }
            maxLength={300}
          />
        </label>
      </div>
    </section>
  );
}
