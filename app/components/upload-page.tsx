"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCandidates } from "../hooks/use-candidates";
import { usePersistentState } from "../hooks/use-persistent-state";
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
  const router = useRouter();
  const [, setCandidates] = useCandidates();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobContext, setJobContext] = usePersistentState(
    "talentlens-job-context",
    "Senior Product Designer",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef(new Map<number, File>());

  function addFiles(list: FileList | null) {
    if (!list) return;

    const existingNames = new Set(files.map((file) => file.name.toLowerCase()));
    const remainingSlots = Math.max(0, MAX_FILES - files.length);
    const selected = Array.from(list);
    const added = selected.map((file, index): UploadFile => {
      const id = Date.now() + index;
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      let error: string | undefined;

      if (index >= remainingSlots) {
        error = `Maximum ${MAX_FILES} files per queue`;
      } else if (!SUPPORTED_EXTENSIONS.includes(extension)) {
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
    if (!pending.length) return;

    setAnalyzing(true);
    let completed = 0;

    for (const item of pending) {
      const source = fileRefs.current.get(item.id);
      if (!source) {
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
          jobContext,
          item.id,
        );

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
        completed += 1;
      } catch (error) {
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
    if (completed > 0) router.push("/candidates");
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

          <div className="upload-footer">
            <span>
              <Icons.sparkles size={16} /> Raw files are processed in memory;
              only candidate metadata is saved locally.
            </span>
            <button
              className="button primary"
              onClick={analyzeFiles}
              disabled={analyzing || queuedCount === 0}
            >
              {analyzing
                ? "Analyzing locally..."
                : `Analyze ${queuedCount} CV${queuedCount === 1 ? "" : "s"}`}
              <Icons.arrowRight size={17} />
            </button>
          </div>
        </section>

        <aside className="upload-sidebar">
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
            <button
              className="job-selector"
              onClick={() =>
                setJobContext((job) =>
                  job === "Senior Product Designer"
                    ? "Staff Frontend Engineer"
                    : "Senior Product Designer",
                )
              }
            >
              <span>
                <strong>{jobContext}</strong>
                <small>Local matching profile</small>
              </span>
              <Icons.chevronDown size={16} />
            </button>
            <button
              className="text-link centered"
              onClick={() =>
                setJobContext((job) =>
                  job === "Senior Product Designer"
                    ? "Staff Frontend Engineer"
                    : "Senior Product Designer",
                )
              }
            >
              Change job context
            </button>
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
