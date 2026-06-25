"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCandidates } from "../hooks/use-candidates";
import {
  useJobProfiles,
  useSelectedJobProfileId,
} from "../hooks/use-job-profiles";
import { useNotifications } from "../hooks/use-notifications";
import { usePrivacyAcknowledged } from "../hooks/use-workspace-settings";
import {
  analyzeResumeText,
  extractResumeText,
} from "../utils/local-resume-analysis";
import { Icons } from "./icons";
import { PageHeader } from "./ui";

type UploadStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "complete"
  | "error";

type UploadFile = {
  id: number;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  error?: string;
};

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt"];

export function UploadPage() {
  const [candidates, setCandidates] = useCandidates();
  const [jobProfiles] = useJobProfiles();
  const [selectedJobId, setSelectedJobId] = useSelectedJobProfileId();
  const [, setNotifications] = useNotifications();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [queueMessage, setQueueMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{
    completed: number;
    failed: number;
  } | null>(null);
  const [privacyAcknowledged, setPrivacyAcknowledged] =
    usePrivacyAcknowledged();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef(new Map<number, File>());
  const selectedJob =
    jobProfiles.find((profile) => profile.id === selectedJobId) ??
    jobProfiles[0];

  function addFiles(list: FileList | null) {
    if (!list) return;

    setQueueMessage("");
    setAnalysisResult(null);

    const existingNames = new Set(files.map((file) => file.name.toLowerCase()));
    const remainingSlots = Math.max(0, MAX_FILES - files.length);
    const selected = Array.from(list);
    if (selected.length > remainingSlots) {
      setQueueMessage(
        `${selected.length - remainingSlots} file${selected.length - remainingSlots === 1 ? " was" : "s were"} not added because the queue limit is ${MAX_FILES}.`,
      );
    }

    const added = selected
      .slice(0, remainingSlots)
      .map((file, index): UploadFile => {
        const id = Date.now() + index;
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        let error: string | undefined;

        if (!SUPPORTED_EXTENSIONS.includes(extension)) {
          error = "Unsupported file type";
        } else if (file.size > MAX_FILE_SIZE) {
          error = "File exceeds the 10 MB limit";
        } else if (file.size === 0) {
          error = "File is empty";
        } else if (existingNames.has(file.name.toLowerCase())) {
          error = "A file with this name is already queued";
        }

        if (!error) {
          existingNames.add(file.name.toLowerCase());
          fileRefs.current.set(id, file);
        }

        return {
          id,
          name: file.name,
          size: formatFileSize(file.size),
          progress: 0,
          status: error ? "error" : "queued",
          error,
        };
      });

    setFiles((current) => [...added, ...current]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyzeFiles() {
    const pending = files.filter((file) => file.status === "queued");
    if (!pending.length || !selectedJob || !privacyAcknowledged) return;

    setAnalyzing(true);
    let completed = 0;
    let failed = 0;
    let nextCandidateId = Math.max(0, ...candidates.map((candidate) => candidate.id)) + 1;

    for (const item of pending) {
      const source = fileRefs.current.get(item.id);
      if (!source) {
        failed += 1;
        updateFile(item.id, {
          status: "error",
          progress: 0,
          error: "The original file is no longer available. Add it again.",
        });
        continue;
      }

      try {
        updateFile(item.id, {
          status: "extracting",
          progress: 25,
          error: undefined,
        });
        const text = await extractResumeText(source);

        updateFile(item.id, {
          status: "analyzing",
          progress: 70,
        });
        const candidate = analyzeResumeText(
          text,
          item.name,
          item.size,
          selectedJob,
          nextCandidateId,
        );
        nextCandidateId += 1;

        setCandidates((current) => [
          candidate,
          ...current.filter(
            (existing) => existing.sourceFile !== candidate.sourceFile,
          ),
        ]);
        updateFile(item.id, {
          status: "complete",
          progress: 100,
        });
        setNotifications((current) => [
          {
            id: `analysis-${candidate.id}`,
            title: `${candidate.name} is ready for review`,
            detail: `Local score ${candidate.score} · ${candidate.targetRole}`,
            href: `/candidates/${candidate.id}`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...current.filter(
            (notification) => notification.id !== `analysis-${candidate.id}`,
          ),
        ]);
        completed += 1;
      } catch (error) {
        failed += 1;
        updateFile(item.id, {
          status: "error",
          progress: 0,
          error:
            error instanceof Error
              ? error.message
              : "The CV could not be analyzed",
        });
      }
    }

    setAnalyzing(false);
    setAnalysisResult({ completed, failed });
  }

  function updateFile(id: number, updates: Partial<UploadFile>) {
    setFiles((current) =>
      current.map((file) => (file.id === id ? { ...file, ...updates } : file)),
    );
  }

  function removeFile(id: number) {
    fileRefs.current.delete(id);
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function clearFiles() {
    fileRefs.current.clear();
    setFiles([]);
    setAnalysisResult(null);
    setQueueMessage("");
  }

  const queuedCount = files.filter((file) => file.status === "queued").length;
  const completeCount = files.filter(
    (file) => file.status === "complete",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Local screening"
        title="Upload candidate CVs"
        description="Read and evaluate CVs locally in your browser, then save the analyzed candidate data."
      />

      <div className="upload-layout">
        <section className="card upload-main-card">
          <div
            className={`dropzone ${dragging ? "is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={(event) => addFiles(event.target.files)}
              className="sr-only"
            />
            <div className="dropzone-icon">
              <Icons.upload size={27} />
            </div>
            <h2>
              {dragging ? "Drop files to add them" : "Drag and drop CVs here"}
            </h2>
            <p>
              or{" "}
              <button onClick={() => inputRef.current?.click()}>
                browse your files
              </button>
            </p>
            <small>
              PDF, DOCX, or TXT · Up to 10 MB each · Maximum 20 files
            </small>
          </div>

          <div className="upload-list-header">
            <div>
              <h2>Analysis queue</h2>
              <p>
                {files.length} files · {completeCount} analyzed
              </p>
            </div>
            {files.length > 0 && (
              <button
                className="text-button"
                onClick={clearFiles}
                disabled={analyzing}
              >
                Clear all
              </button>
            )}
          </div>

          {queueMessage && (
            <p className="queue-message" role="status">
              {queueMessage}
            </p>
          )}

          <div className="upload-list" aria-live="polite">
            {files.length === 0 ? (
              <div className="empty-state compact">
                <span>
                  <Icons.file size={24} />
                </span>
                <h3>No files in the queue</h3>
                <p>Selected CVs remain in memory until this page is closed.</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  className={`upload-row upload-${file.status}`}
                  key={file.id}
                >
                  <div className="upload-file-icon">
                    <Icons.file size={20} />
                  </div>
                  <div className="upload-file-copy">
                    <div className="upload-file-top">
                      <strong>{file.name}</strong>
                      <span>{file.size}</span>
                    </div>
                    {file.status === "error" ? (
                      <p className="error-text">
                        <Icons.close size={13} /> {file.error}
                      </p>
                    ) : (
                      <div className="progress-row">
                        <div className="progress-track">
                          <span style={{ width: `${file.progress}%` }} />
                        </div>
                        <small>{getStatusLabel(file)}</small>
                      </div>
                    )}
                  </div>
                  <div className={`upload-status-icon ${file.status}`}>
                    {file.status === "complete" ? (
                      <Icons.check size={16} />
                    ) : file.status === "error" ? (
                      <Icons.close size={16} />
                    ) : file.status === "queued" ? (
                      <span className="queued-dot" />
                    ) : (
                      <span className="spinner" />
                    )}
                  </div>
                  <button
                    className="ghost-icon"
                    aria-label={`Remove ${file.name}`}
                    disabled={analyzing}
                    onClick={() => removeFile(file.id)}
                  >
                    <Icons.close size={17} />
                  </button>
                </div>
              ))
            )}
          </div>

          {analysisResult && (
            <div
              className={`analysis-result ${analysisResult.failed ? "has-errors" : ""}`}
              role="status"
            >
              <span>
                <strong>
                  {analysisResult.completed} CV
                  {analysisResult.completed === 1 ? "" : "s"} analyzed
                </strong>
                {analysisResult.failed > 0 && (
                  <small>
                    {analysisResult.failed} file
                    {analysisResult.failed === 1 ? "" : "s"} need attention
                  </small>
                )}
              </span>
              {analysisResult.completed > 0 && (
                <Link href="/candidates" className="button secondary">
                  View candidates <Icons.arrowRight size={16} />
                </Link>
              )}
            </div>
          )}

          <div className="upload-footer">
            <span>
              <Icons.sparkles size={16} /> Raw files are processed in memory;
              only candidate metadata is saved locally.
            </span>
            <button
              className="button primary"
              onClick={analyzeFiles}
              disabled={
                analyzing ||
                queuedCount === 0 ||
                !selectedJob ||
                !privacyAcknowledged
              }
            >
              {analyzing
                ? "Analyzing locally..."
                : `Analyze ${queuedCount} CV${queuedCount === 1 ? "" : "s"}`}
              <Icons.arrowRight size={17} />
            </button>
          </div>
        </section>

        <aside className="upload-sidebar">
          <section className="card privacy-check-card">
            <div className="aside-icon violet">
              <Icons.check size={20} />
            </div>
            <h2>Local privacy check</h2>
            <p>
              Raw files stay in browser memory. Extracted candidate metadata,
              contact details, scores, and notes are saved in localStorage.
            </p>
            <label className="privacy-checkbox">
              <input
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(event) =>
                  setPrivacyAcknowledged(event.target.checked)
                }
              />
              <span>I understand this device stores the analyzed metadata.</span>
            </label>
            <Link className="text-link centered" href="/settings">
              Review privacy and backups
            </Link>
          </section>
          <section className="card">
            <div className="aside-icon violet">
              <Icons.sparkles size={20} />
            </div>
            <h2>What happens next?</h2>
            <ol className="steps-list">
              <li>
                <span>1</span>
                <div>
                  <strong>Local text extraction</strong>
                  <p>The browser reads PDF, DOCX, or TXT content in memory.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Local matching</strong>
                  <p>Skills, experience, and education are scored locally.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Saved results</strong>
                  <p>Only derived candidate metadata is stored locally.</p>
                </div>
              </li>
            </ol>
          </section>
          <section className="card job-context-card">
            <div className="aside-icon blue">
              <Icons.briefcase size={20} />
            </div>
            <h2>Job context</h2>
            <p>CVs will be evaluated against:</p>
            <label className="job-selector">
              <span>
                <strong>{selectedJob?.name ?? "No job profile"}</strong>
                <small>Local matching profile</small>
              </span>
              <select
                value={selectedJob?.id ?? ""}
                onChange={(event) => setSelectedJobId(event.target.value)}
                aria-label="Job matching profile"
              >
                {jobProfiles.map((job) => (
                  <option value={job.id} key={job.id}>
                    {job.name}
                  </option>
                ))}
              </select>
              <Icons.chevronDown size={16} />
            </label>
            <Link className="text-link centered" href="/jobs">
              Edit job profiles
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

function getStatusLabel(file: UploadFile) {
  if (file.status === "queued") return "Ready";
  if (file.status === "extracting") return "Reading CV";
  if (file.status === "analyzing") return "Scoring";
  return "Analyzed";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
