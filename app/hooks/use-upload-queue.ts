"use client";

import {
  type Dispatch,
  type SetStateAction,
  useReducer,
  useRef,
} from "react";
import type { JobProfile } from "../data/job-profiles";
import type { Candidate } from "../data/mock-data";
import type { AnalysisResult, UploadFile } from "../components/upload/types";
import { analyzeResumeFileInWorker } from "../utils/resume-worker-client";
import { useCandidates } from "./use-candidates";
import { useNotifications } from "./use-notifications";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt"];

type UploadQueueState = {
  files: UploadFile[];
  dragging: boolean;
  analyzing: boolean;
  queueMessage: string;
  analysisResult: AnalysisResult | null;
};

type UploadQueueAction =
  | { type: "ADD_FILES"; files: UploadFile[]; queueMessage: string }
  | { type: "REMOVE_FILE"; id: number }
  | { type: "CLEAR_QUEUE" }
  | { type: "UPDATE_FILE"; id: number; updates: Partial<UploadFile> }
  | { type: "START_ANALYSIS" }
  | { type: "FINISH_ANALYSIS"; result: AnalysisResult }
  | { type: "SET_QUEUE_MESSAGE"; message: string }
  | { type: "SET_ANALYSIS_RESULT"; result: AnalysisResult | null }
  | { type: "SET_DRAGGING"; dragging: boolean };

type UploadQueueOptions = {
  selectedJob: JobProfile | undefined;
  privacyAcknowledged: boolean;
};

type UploadValidationContext = {
  existingNames: Set<string>;
  existingFingerprints: Set<string>;
  savedFingerprints: Set<string>;
};

const initialUploadQueueState: UploadQueueState = {
  files: [],
  dragging: false,
  analyzing: false,
  queueMessage: "",
  analysisResult: null,
};

export function useUploadQueue({
  selectedJob,
  privacyAcknowledged,
}: UploadQueueOptions) {
  const [candidates, setCandidates] = useCandidates();
  const [, setNotifications] = useNotifications();
  const [state, dispatch] = useReducer(
    uploadQueueReducer,
    initialUploadQueueState,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef(new Map<number, File>());

  const queuedCount = state.files.filter(
    (file) => file.status === "queued",
  ).length;
  const completeCount = state.files.filter(
    (file) => file.status === "complete",
  ).length;
  const canAnalyze =
    !state.analyzing &&
    queuedCount > 0 &&
    Boolean(selectedJob) &&
    privacyAcknowledged;

  const setDragging: Dispatch<SetStateAction<boolean>> = (action) => {
    dispatch({
      type: "SET_DRAGGING",
      dragging:
        typeof action === "function" ? action(state.dragging) : action,
    });
  };

  function addFiles(list: FileList | null) {
    if (!list) return;

    dispatch({ type: "SET_ANALYSIS_RESULT", result: null });

    const selectedFiles = Array.from(list);
    const remainingSlots = Math.max(0, MAX_FILES - state.files.length);
    const context = createValidationContext(state.files, candidates);
    const added = selectedFiles
      .slice(0, remainingSlots)
      .map((file, index) => buildUploadFile(file, index, context));

    added.forEach(({ source, uploadFile }) => {
      if (source) fileRefs.current.set(uploadFile.id, source);
    });
    dispatch({
      type: "ADD_FILES",
      files: added.map(({ uploadFile }) => uploadFile),
      queueMessage: getQueueLimitMessage(
        selectedFiles.length,
        remainingSlots,
      ),
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyzeFiles() {
    const pending = state.files.filter((file) => file.status === "queued");
    if (!pending.length || !selectedJob || !privacyAcknowledged) return;

    dispatch({ type: "START_ANALYSIS" });

    let completed = 0;
    let failed = 0;
    let nextCandidateId =
      Math.max(0, ...candidates.map((candidate) => candidate.id)) + 1;

    for (const item of pending) {
      const analyzed = await analyzeQueuedFile({
        item,
        source: fileRefs.current.get(item.id),
        selectedJob,
        candidateId: nextCandidateId,
        updateFile,
        saveCandidate(candidate) {
          saveAnalyzedCandidate(candidate, setCandidates, setNotifications);
        },
      });

      if (analyzed) {
        completed += 1;
        nextCandidateId += 1;
      } else {
        failed += 1;
      }
    }

    dispatch({
      type: "FINISH_ANALYSIS",
      result: { completed, failed },
    });
  }

  function updateFile(id: number, updates: Partial<UploadFile>) {
    dispatch({ type: "UPDATE_FILE", id, updates });
  }

  function removeFile(id: number) {
    fileRefs.current.delete(id);
    dispatch({ type: "REMOVE_FILE", id });
  }

  function clearFiles() {
    fileRefs.current.clear();
    dispatch({ type: "CLEAR_QUEUE" });
  }

  return {
    files: state.files,
    dragging: state.dragging,
    setDragging,
    inputRef,
    queueMessage: state.queueMessage,
    analysisResult: state.analysisResult,
    analyzing: state.analyzing,
    queuedCount,
    completeCount,
    canAnalyze,
    addFiles,
    clearFiles,
    removeFile,
    analyzeFiles,
  };
}

function uploadQueueReducer(
  state: UploadQueueState,
  action: UploadQueueAction,
): UploadQueueState {
  switch (action.type) {
    case "ADD_FILES":
      return {
        ...state,
        files: [...action.files, ...state.files],
        queueMessage: action.queueMessage,
      };
    case "REMOVE_FILE":
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.id),
      };
    case "CLEAR_QUEUE":
      return initialUploadQueueState;
    case "UPDATE_FILE":
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.id ? { ...file, ...action.updates } : file,
        ),
      };
    case "START_ANALYSIS":
      return { ...state, analyzing: true };
    case "FINISH_ANALYSIS":
      return {
        ...state,
        analyzing: false,
        analysisResult: action.result,
      };
    case "SET_QUEUE_MESSAGE":
      return { ...state, queueMessage: action.message };
    case "SET_ANALYSIS_RESULT":
      return { ...state, analysisResult: action.result };
    case "SET_DRAGGING":
      return { ...state, dragging: action.dragging };
  }
}

function createValidationContext(
  files: UploadFile[],
  candidates: Candidate[],
): UploadValidationContext {
  return {
    existingNames: new Set(files.map((file) => file.name.toLowerCase())),
    existingFingerprints: new Set(files.map((file) => file.fingerprint)),
    savedFingerprints: getSavedFingerprints(candidates),
  };
}

function buildUploadFile(
  file: File,
  index: number,
  context: UploadValidationContext,
) {
  const id = Date.now() + index;
  const size = formatFileSize(file.size);
  const fingerprint = createFileFingerprint(file);
  const error = validateUploadFile(file, fingerprint, size, context);

  if (!error) {
    context.existingNames.add(file.name.toLowerCase());
    context.existingFingerprints.add(fingerprint);
  }

  return {
    source: error ? undefined : file,
    uploadFile: {
      id,
      name: file.name,
      size,
      fingerprint,
      progress: 0,
      status: error ? "error" : "queued",
      error,
    } satisfies UploadFile,
  };
}

function validateUploadFile(
  file: File,
  fingerprint: string,
  displaySize: string,
  context: UploadValidationContext,
) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return "Unsupported file type";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File exceeds the 10 MB limit";
  }
  if (file.size === 0) {
    return "File is empty";
  }

  return checkDuplicate(file.name, fingerprint, displaySize, context);
}

function checkDuplicate(
  fileName: string,
  fingerprint: string,
  displaySize: string,
  context: UploadValidationContext,
) {
  if (context.existingFingerprints.has(fingerprint)) {
    return "This exact file is already queued";
  }
  if (
    context.savedFingerprints.has(fingerprint) ||
    context.savedFingerprints.has(createDisplayFingerprint(fileName, displaySize))
  ) {
    return "This exact file was already analyzed";
  }
  if (context.existingNames.has(fileName.toLowerCase())) {
    return "A file with this name is already queued";
  }
  return undefined;
}

async function analyzeQueuedFile({
  item,
  source,
  selectedJob,
  candidateId,
  updateFile,
  saveCandidate,
}: {
  item: UploadFile;
  source: File | undefined;
  selectedJob: JobProfile;
  candidateId: number;
  updateFile: (id: number, updates: Partial<UploadFile>) => void;
  saveCandidate: (candidate: Candidate) => void;
}) {
  if (!source) {
    updateFile(item.id, {
      status: "error",
      progress: 0,
      error: "The original file is no longer available. Add it again.",
    });
    return false;
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
      candidateId,
    });

    saveCandidate(candidate);
    updateFile(item.id, {
      status: "complete",
      progress: 100,
    });
    return true;
  } catch (error) {
    updateFile(item.id, {
      status: "error",
      progress: 0,
      error:
        error instanceof Error
          ? error.message
          : "The CV could not be analyzed",
    });
    return false;
  }
}

function saveAnalyzedCandidate(
  candidate: Candidate,
  setCandidates: ReturnType<typeof useCandidates>[1],
  setNotifications: ReturnType<typeof useNotifications>[1],
) {
  setCandidates((current) => [
    candidate,
    ...current.filter(
      (existing) => existing.sourceFile !== candidate.sourceFile,
    ),
  ]);
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
}

function getSavedFingerprints(candidates: Candidate[]) {
  return new Set(
    candidates.flatMap((candidate) => [
      ...(candidate.sourceFingerprint ? [candidate.sourceFingerprint] : []),
      ...(candidate.sourceFile && candidate.sourceSize
        ? [createDisplayFingerprint(candidate.sourceFile, candidate.sourceSize)]
        : []),
    ]),
  );
}

function getQueueLimitMessage(selectedCount: number, remainingSlots: number) {
  if (selectedCount <= remainingSlots) return "";

  const skippedCount = selectedCount - remainingSlots;
  return `${skippedCount} file${skippedCount === 1 ? " was" : "s were"} not added because the queue limit is ${MAX_FILES}.`;
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
