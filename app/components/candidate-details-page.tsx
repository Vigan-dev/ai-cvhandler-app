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
import { getMatchSignalLabel } from "../utils/match-signal-labels";
import { CandidateHero } from "./candidate-details/CandidateHero";
import { ExperiencePanel } from "./candidate-details/ExperiencePanel";
import { MissingCandidate } from "./candidate-details/MissingCandidate";
import { NotesPanel } from "./candidate-details/NotesPanel";
import { OverviewPanel } from "./candidate-details/OverviewPanel";
import { ProfileEditor } from "./candidate-details/ProfileEditor";
import { ScorePanel } from "./candidate-details/ScorePanel";
import { SkillsPanel } from "./candidate-details/SkillsPanel";
import { ConfirmationDialog } from "./confirmation-dialog";

type DetailTab = "Overview" | "Profile" | "Experience" | "Skills" | "Notes";

const detailTabs: DetailTab[] = [
  "Overview",
  "Profile",
  "Experience",
  "Skills",
  "Notes",
];

export function CandidateDetailsPage({
  candidateId,
}: {
  candidateId: number;
}) {
  const router = useRouter();
  const [candidates, setCandidates, hydrated] = useCandidates();
  const [tab, setTab] = useState<DetailTab>("Overview");
  const [confirmRemovalOpen, setConfirmRemovalOpen] = useState(false);
  const candidate = candidates.find((item) => item.id === candidateId);

  if (!candidate) {
    return <MissingCandidate hydrated={hydrated} />;
  }

  const selectedCandidate = candidate;
  const scoreLabel = getScoreLabel(selectedCandidate.score);
  const targetRole = selectedCandidate.targetRole ?? selectedCandidate.role;
  const matchSignalCopy = getMatchSignalCopy(
    selectedCandidate,
    targetRole,
  );

  function exportAnalysis() {
    downloadCsv(
      `${selectedCandidate.name.toLowerCase().replaceAll(" ", "-")}-analysis.csv`,
      [
        ["Field", "Value"],
        ["Candidate", selectedCandidate.name],
        ["Current role", selectedCandidate.role],
        ["Target role", targetRole],
        ["Location", selectedCandidate.location],
        ["Overall score", selectedCandidate.score],
        ["Skills score", selectedCandidate.skills],
        ["Experience score", selectedCandidate.experience],
        ["Education score", selectedCandidate.education],
        ["Match signal", getMatchSignalLabel(selectedCandidate.status)],
        ["Stage", selectedCandidate.stage],
        ["Skills detected", selectedCandidate.tags.join(", ")],
        ["Source file", selectedCandidate.sourceFile ?? "Demo candidate"],
        ["Notes", selectedCandidate.notes ?? ""],
      ],
    );
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

  function updateMatchSignal(status: CandidateStatus) {
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

  function removeCandidate() {
    setConfirmRemovalOpen(true);
  }

  function confirmRemoveCandidate() {
    setConfirmRemovalOpen(false);
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
        <span>{selectedCandidate.name}</span>
      </div>

      <CandidateHero
        candidate={selectedCandidate}
        onExport={exportAnalysis}
        onMoveToInterview={moveToInterview}
      />

      <DetailTabs activeTab={tab} onTabChange={setTab} />

      <div className="details-layout">
        <div className="details-main">
          {tab === "Overview" && (
            <OverviewPanel
              candidate={selectedCandidate}
              scoreLabel={scoreLabel}
              targetRole={targetRole}
            />
          )}
          {tab === "Profile" && (
            <ProfileEditor
              candidate={selectedCandidate}
              onUpdate={updateCandidate}
            />
          )}
          {tab === "Experience" && (
            <ExperiencePanel candidate={selectedCandidate} />
          )}
          {tab === "Skills" && <SkillsPanel candidate={selectedCandidate} />}
          {tab === "Notes" && (
            <NotesPanel
              candidate={selectedCandidate}
              onUpdateNotes={(notes) => updateCandidate({ notes })}
            />
          )}
        </div>

        <ScorePanel
          candidate={selectedCandidate}
          scoreLabel={scoreLabel}
          targetRole={targetRole}
          matchSignalCopy={matchSignalCopy}
          onMoveToInterview={moveToInterview}
          onMatchSignalChange={updateMatchSignal}
          onStageChange={updateStage}
          onRemoveCandidate={removeCandidate}
        />
      </div>

      <ConfirmationDialog
        open={confirmRemovalOpen}
        tone="danger"
        title="Remove candidate?"
        description={`Remove ${selectedCandidate.name} from local storage? This cannot be undone.`}
        confirmLabel="Remove candidate"
        onConfirm={confirmRemoveCandidate}
        onCancel={() => setConfirmRemovalOpen(false)}
      />
    </>
  );
}

function DetailTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  return (
    <div className="detail-tabs" role="tablist">
      {detailTabs.map((item) => (
        <button
          key={item}
          role="tab"
          id={`candidate-tab-${item.toLowerCase()}`}
          aria-controls={`candidate-panel-${item.toLowerCase()}`}
          aria-selected={activeTab === item}
          className={activeTab === item ? "active" : ""}
          onClick={() => onTabChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Strong match";
  if (score >= 70) return "Potential match";
  return "Limited match";
}

function getMatchSignalCopy(candidate: Candidate, targetRole: string) {
  if (candidate.status === "Hire") {
    return `The local analysis found strong evidence aligned with the ${targetRole} requirements.`;
  }
  if (candidate.status === "Review") {
    return `The profile has partial evidence for ${targetRole} and needs human review before any next step.`;
  }
  return `The profile currently has limited explicit evidence for ${targetRole}.`;
}
