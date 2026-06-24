"use client";

import Link from "next/link";
import { useState } from "react";
import { useCandidates } from "../hooks/use-candidates";
import { downloadCsv } from "../utils/download-csv";
import { Avatar, ScoreRing, StatusBadge } from "./ui";
import { Icons } from "./icons";

type DetailTab = "Overview" | "Experience" | "Skills" | "Notes";

export function CandidateDetailsPage({
  candidateId,
}: {
  candidateId: number;
}) {
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
    downloadCsv(`${candidate.name.toLowerCase().replaceAll(" ", "-")}-analysis.csv`, [
      ["Field", "Value"],
      ["Candidate", candidate.name],
      ["Current role", candidate.role],
      ["Target role", targetRole],
      ["Location", candidate.location],
      ["Overall score", candidate.score],
      ["Skills score", candidate.skills],
      ["Experience score", candidate.experience],
      ["Education score", candidate.education],
      ["Recommendation", candidate.status],
      ["Skills detected", candidate.tags.join(", ")],
      ["Source file", candidate.sourceFile ?? "Demo candidate"],
    ]);
  }

  function recommendInterview() {
    setCandidates((current) =>
      current.map((item) =>
        item.id === candidate.id ? { ...item, status: "Hire" } : item,
      ),
    );
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
                <span>
                  <Icons.mail size={14} />
                  {candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span>
                  <Icons.phone size={14} />
                  {candidate.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="candidate-hero-actions">
          <button className="button secondary" onClick={exportAnalysis}>
            <Icons.download size={17} /> Export analysis
          </button>
          <button className="button primary" onClick={recommendInterview}>
            Recommend interview <Icons.arrowRight size={17} />
          </button>
        </div>
      </section>

      <div className="detail-tabs" role="tablist">
        {(["Overview", "Experience", "Skills", "Notes"] as DetailTab[]).map(
          (item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <div className="details-layout">
        <div className="details-main">
          {tab === "Overview" && (
            <section className="card ai-summary-card">
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
            </section>
          )}

          {tab === "Experience" && (
            <section className="card experience-card">
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
            <section className="card skills-card">
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
            <section className="card experience-card">
              <div className="empty-state compact">
                <span>
                  <Icons.file size={24} />
                </span>
                <h3>No notes yet</h3>
                <p>
                  Notes are not generated automatically from private CV content.
                </p>
              </div>
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
            <button className="button success" onClick={recommendInterview}>
              Recommend interview
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
                <dt>Storage</dt>
                <dd>Browser localStorage</dd>
              </div>
            </dl>
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
