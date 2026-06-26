import type { Candidate } from "../../data/mock-data";

export function ExperiencePanel({ candidate }: { candidate: Candidate }) {
  return (
    <section
      className="card experience-card"
      id="candidate-panel-experience"
      role="tabpanel"
      aria-labelledby="candidate-tab-experience"
    >
      <div className="section-header">
        <div>
          <h2>Experience detected</h2>
          <p>Derived from readable CV text</p>
        </div>
      </div>
      <div className="timeline">
        <div className="timeline-item">
          <div className="timeline-marker">
            <span>{candidate.experienceYears ?? 0}</span>
          </div>
          <div className="timeline-copy">
            <div>
              <h3>{candidate.role}</h3>
              <span>
                {candidate.experienceYears
                  ? `${candidate.experienceYears}+ years referenced`
                  : "Duration not clearly stated"}
              </span>
            </div>
            <strong>{candidate.sourceFile ?? "Demo profile"}</strong>
            <p>
              The experience score is {candidate.experience}/100. Review the
              original CV before making a hiring decision.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
