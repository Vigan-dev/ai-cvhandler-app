"use client";

import { useRef, useState } from "react";
import { useCandidates } from "../hooks/use-candidates";
import {
  useJobProfiles,
  useSelectedJobProfileId,
} from "../hooks/use-job-profiles";
import { useNotifications } from "../hooks/use-notifications";
import { usePrivacyAcknowledged } from "../hooks/use-workspace-settings";
import { analyzeResumeFileInWorker } from "../utils/resume-worker-client";
import { UploadMainCard } from "./upload/UploadMainCard";
import { UploadSidebar } from "./upload/UploadSidebar";
import type { AnalysisResult, UploadFile } from "./upload/types";
import { PageHeader } from "./ui";

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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
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
    const existingFingerprints = new Set(files.map((file) => file.fingerprint));
    const savedFingerprints = new Set(
      candidates.flatMap((candidate) => [
        ...(candidate.sourceFingerprint ? [candidate.sourceFingerprint] : []),
        ...(candidate.sourceFile && candidate.sourceSize
          ? [
              createDisplayFingerprint(
                candidate.sourceFile,
                candidate.sourceSize,
              ),
            ]
          : []),
      ]),
    );
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
        const fingerprint = createFileFingerprint(file);
        let error: string | undefined;

        if (!SUPPORTED_EXTENSIONS.includes(extension)) {
          error = "Unsupported file type";
        } else if (file.size > MAX_FILE_SIZE) {
          error = "File exceeds the 10 MB limit";
        } else if (file.size === 0) {
          error = "File is empty";
        } else if (existingFingerprints.has(fingerprint)) {
          error = "This exact file is already queued";
        } else if (
          savedFingerprints.has(fingerprint) ||
          savedFingerprints.has(
            createDisplayFingerprint(file.name, formatFileSize(file.size)),
          )
        ) {
          error = "This exact file was already analyzed";
        } else if (existingNames.has(file.name.toLowerCase())) {
          error = "A file with this name is already queued";
        }

        if (!error) {
          existingNames.add(file.name.toLowerCase());
          existingFingerprints.add(fingerprint);
          fileRefs.current.set(id, file);
        }

        return {
          id,
          name: file.name,
          size: formatFileSize(file.size),
          fingerprint,
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
    let nextCandidateId =
      Math.max(0, ...candidates.map((candidate) => candidate.id)) + 1;

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
        updateFile(item.id, {
          status: "analyzing",
          progress: 70,
        });
        const candidate = await analyzeResumeFileInWorker({
          file: source,
          sourceFile: item.name,
          sourceSize: item.size,
          sourceFingerprint: item.fingerprint,
          jobProfile: selectedJob,
          candidateId: nextCandidateId,
        });
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
  const canAnalyze =
    !analyzing && queuedCount > 0 && Boolean(selectedJob) && privacyAcknowledged;

  return (
    <>
      <PageHeader
        eyebrow="Local screening"
        title="Upload candidate CVs"
        description="Read and evaluate CVs locally in your browser, then save the analyzed candidate data."
      />

      <div className="upload-layout">
        <UploadMainCard
          files={files}
          dragging={dragging}
          setDragging={setDragging}
          inputRef={inputRef}
          queueMessage={queueMessage}
          analysisResult={analysisResult}
          analyzing={analyzing}
          queuedCount={queuedCount}
          completeCount={completeCount}
          canAnalyze={canAnalyze}
          onAddFiles={addFiles}
          onClearFiles={clearFiles}
          onRemoveFile={removeFile}
          onAnalyzeFiles={analyzeFiles}
        />

        <UploadSidebar
          jobProfiles={jobProfiles}
          selectedJob={selectedJob}
          setSelectedJobId={setSelectedJobId}
          privacyAcknowledged={privacyAcknowledged}
          setPrivacyAcknowledged={setPrivacyAcknowledged}
        />
      </div>
    </>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function createFileFingerprint(file: File) {
  return `${file.name.toLowerCase()}::${file.size}::${file.lastModified}`;
}

function createDisplayFingerprint(fileName: string, fileSize: string) {
  return `${fileName.toLowerCase()}::${fileSize}`;
}
