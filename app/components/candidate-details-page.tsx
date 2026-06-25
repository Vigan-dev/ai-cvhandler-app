"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
} from "../data/mock-data";
import { useCandidates } from "../hooks/use-candidates";
import { downloadCsv } from "../utils/download-csv";
import { Avatar, ScoreRing, StatusBadge } from "./ui";
import { Icons } from "./icons";

type DetailTab = "Overview" | "Profile" | "Experience" | "Skills" | "Notes";

export function CandidateDetailsPage({
  candidateId,
}: {
  candidateId: number;
}) {
  const router = useRouter();
  const [candidates, setCandidates, hydrated] = useCandidates();
  const [tab, setTab] = useState<DetailTab>("Overview");
  const candidate = candidates.find((item) => item.id === candidateId);

  if (!candidate) {
    return (
      <section className="card empty-state">
        <span>
          <Icons.users size={26} />
        </span>
        <h2>{hydrated ? "Candidate not found" : "Loading candidate..."}</h2>
        <p>
          {hydrated
            ? "This candidate is not available in local storage."
            : "Reading locally stored candidate data."}
        </p>
        {hydrated && (
          <Link href="/candidates" className="button secondary">
            Back to candidates
          </Link>
        )}
      </section>
    );
  }
  const selectedCandidate = candidate;

  const scoreLabel =
    candidate.score >= 85
      ? "Strong match"
      : candidate.score >= 70
        ? "Potential match"
        : "Limited match";
  const targetRole = candidate.targetRole ?? candidate.role;
  const recommendationCopy =
    candidate.status === "Hire"
      ? `The local analysis found strong alignment with the ${targetRole} requirements.`
      : candidate.status === "Review"
        ? `The profile has partial alignment with ${targetRole} and needs human review before progressing.`
        : `The profile currently falls below the matching threshold for ${targetRole}.`;

  function exportAnalysis() {
    downloadCsv(`${selectedCandidate.name.toLowerCase().replaceAll(" ", "-")}-analysis.csv`, [
      ["Field", "Value"],
      ["Candidate", selectedCandidate.name],
      ["Current role", selectedCandidate.role],
      ["Target role", targetRole],
      ["Location", selectedCandidate.location],
      ["Overall score", selectedCandidate.score],
      ["Skills score", selectedCandidate.skills],
      ["Experience score", selectedCandidate.experience],
      ["Education score", selectedCandidate.education],
      ["Recommendation", selectedCandidate.status],
      ["Stage", selectedCandidate.stage],
      ["Skills detected", selectedCandidate.tags.join(", ")],
      ["Source file", selectedCandidate.sourceFile ?? "Demo candidate"],
      ["Notes", selectedCandidate.notes ?? ""],
    ]);
  }

  function moveToInterview() {
    setCandidates((current) =>
      current.map((item) =>
        item.id === selectedCandidate.id
          ? {
              ...item,
              stage: "Interview",
              status: item.status === "Reject" ? "Review" : item.status,
            }
          : item,
      ),
    );
  }

  function updateCandidate(changes: Partial<Candidate>) {
    setCandidates((current) =>
      current.map((item) =>
        item.id === selectedCandidate.id ? { ...item, ...changes } : item,
      ),
    );
  }

  function updateStage(stage: CandidateStage) {
    updateCandidate({
      stage,
      status:
        stage === "Rejected"
          ? "Reject"
          : selectedCandidate.status === "Reject"
            ? "Review"
            : selectedCandidate.status,
    });
  }

  function updateRecommendation(status: CandidateStatus) {
    updateCandidate({
      status,
      stage:
        status === "Reject"
          ? "Rejected"
          : selectedCandidate.stage === "Rejected"
            ? "Review"
            : selectedCandidate.stage,
    });
  }

  function updateNotes(notes: string) {
    setCandidates((current) =>
      current.map((item) =>
        item.id === selectedCandidate.id ? { ...item, notes } : item,
      ),
    );
  }

  function removeCandidate() {
    if (
      !window.confirm(
        `Remove ${selectedCandidate.name} from local storage? This cannot be undone.`,
      )
    ) {
      return;
    }

    setCandidates((current) =>
      current.filter((item) => item.id !== selectedCandidate.id),
    );
    router.replace("/candidates");
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/candidates">Candidates</Link>
        <span>/</span>
        <span>{candidate.name}</span>
      </div>
      <section className="candidate-hero card">
        <div className="candidate-identity">
          <Avatar candidate={candidate} size="large" />
          <div>
            <div className="identity-title">
              <h1>{candidate.name}</h1>
              <StatusBadge status={candidate.status} />
            </div>
            <p>{candidate.role}</p>
            <div className="contact-row">
              <span>
                <Icons.location size={14} />
                {candidate.location}
              </span>
              {candidate.email && (
                <a href={`mailto:${candidate.email}`}>
                  <Icons.mail size={14} />
                  {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`}>
                  <Icons.phone size={14} />
                  {candidate.phone}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="candidate-hero-actions">
          <button className="button secondary" onClick={exportAnalysis}>
            <Icons.download size={17} /> Export analysis
          </button>
          <button
            className="button primary"
            onClick={moveToInterview}
            disabled={candidate.stage === "Interview"}
          >
            {candidate.stage === "Interview"
              ? "Interview stage"
              : "Move to interview"}{" "}
            <Icons.arrowRight size={17} />
          </button>
        </div>
      </section>

      <div className="detail-tabs" role="tablist">
        {(
          ["Overview", "Profile", "Experience", "Skills", "Notes"] as DetailTab[]
        ).map((item) => (
            <button
              key={item}
              role="tab"
              id={`candidate-tab-${item.toLowerCase()}`}
              aria-controls={`candidate-panel-${item.toLowerCase()}`}
              aria-selected={tab === item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
      </div>

      <div className="details-layout">
        <div className="details-main">
          {tab === "Overview" && (
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
                <span className="confidence">Rule-based local analysis</span>
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
                      {candidate.analysisConfidence ?? "Medium"} confidence
                    </span>
                  </div>
                  <ul>
                    {candidate.scoreReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          )}

          {tab === "Profile" && (
            <section
              className="card profile-editor-card"
              id="candidate-panel-profile"
              role="tabpanel"
              aria-labelledby="candidate-tab-profile"
            >
              <div className="section-header">
                <div>
                  <h2>Correct candidate profile</h2>
                  <p>
                    Manual changes are saved locally and do not alter the source
                    CV.
                  </p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span>Name</span>
                  <input
                    value={candidate.name}
                    onChange={(event) =>
                      updateCandidate({ name: event.target.value })
                    }
                    maxLength={120}
                  />
                </label>
                <label>
                  <span>Current role</span>
                  <input
                    value={candidate.role}
                    onChange={(event) =>
                      updateCandidate({ role: event.target.value })
                    }
                    maxLength={160}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={candidate.email ?? ""}
                    onChange={(event) =>
                      updateCandidate({
                        email: event.target.value || undefined,
                      })
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
                      updateCandidate({
                        phone: event.target.value || undefined,
                      })
                    }
                    maxLength={60}
                  />
                </label>
                <label>
                  <span>Location</span>
                  <input
                    value={candidate.location}
                    onChange={(event) =>
                      updateCandidate({ location: event.target.value })
                    }
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
                      updateCandidate({
                        experienceYears: Math.max(
                          0,
                          Number(event.target.value),
                        ),
                      })
                    }
                  />
                </label>
                <label className="full">
                  <span>Education</span>
                  <input
                    value={candidate.educationText ?? ""}
                    onChange={(event) =>
                      updateCandidate({
                        educationText: event.target.value || undefined,
                      })
                    }
                    maxLength={300}
                  />
                </label>
              </div>
            </section>
          )}

          {tab === "Experience" && (
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
                      The experience score is {candidate.experience}/100. Review
                      the original CV before making a hiring decision.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === "Skills" && (
            <section
              className="card skills-card"
              id="candidate-panel-skills"
              role="tabpanel"
              aria-labelledby="candidate-tab-skills"
            >
              <div className="section-header">
                <div>
                  <h2>Skills detected</h2>
                  <p>{candidate.tags.length} skills found in readable CV text</p>
                </div>
              </div>
              <div className="skills-groups">
                <div>
                  <h3>Detected skills</h3>
                  <div className="tag-row large">
                    {candidate.tags.length ? (
                      candidate.tags.map((item) => (
                        <span key={item}>
                          {item}
                          <i>
                            <Icons.check size={11} />
                          </i>
                        </span>
                      ))
                    ) : (
                      <span>No catalogued skills detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3>Education</h3>
                  <div className="tag-row large subtle">
                    <span>
                      {candidate.educationText ??
                        "Education details were not clearly identified"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === "Notes" && (
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
                  onChange={(event) => updateNotes(event.target.value)}
                  placeholder="Add interview observations, follow-up questions, or review notes..."
                  maxLength={4000}
                />
                <small>{(candidate.notes ?? "").length}/4000</small>
              </label>
            </section>
          )}
        </div>

        <aside className="details-sidebar">
          <section className="card score-overview-card">
            <h2>Overall local score</h2>
            <div className="hero-score">
              <ScoreRing value={candidate.score} size={124} />
              <span>{scoreLabel}</span>
              <small>Review before making a hiring decision</small>
            </div>
            <div className="score-breakdown">
              <ScoreLine label="Skills match" value={candidate.skills} />
              <ScoreLine label="Experience" value={candidate.experience} />
              <ScoreLine label="Education" value={candidate.education} />
            </div>
          </section>
          <section
            className={`card recommendation-card recommendation-${candidate.status.toLowerCase()}`}
          >
            <span className="recommendation-icon">
              {candidate.status === "Reject" ? (
                <Icons.close size={22} />
              ) : candidate.status === "Review" ? (
                "!"
              ) : (
                <Icons.check size={22} />
              )}
            </span>
            <h2>Recommendation: {candidate.status}</h2>
            <p>
              {recommendationCopy} This recommendation should support, not
              replace, human review.
            </p>
            <div className="workflow-controls">
              <label>
                <span>Recommendation</span>
                <select
                  value={candidate.status}
                  onChange={(event) =>
                    updateRecommendation(
                      event.target.value as CandidateStatus,
                    )
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
                    updateStage(event.target.value as CandidateStage)
                  }
                >
                  <option value="New">New</option>
                  <option value="Review">Review</option>
                  <option value="Interview">Interview</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
            </div>
            <button
              className="button success"
              onClick={moveToInterview}
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
            </dl>
            <button className="text-button danger-link" onClick={removeCandidate}>
              Remove candidate
            </button>
          </section>
        </aside>
      </div>
    </>
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
