import type { JobProfile } from "../data/job-profiles";
import type { Candidate } from "../data/mock-data";
import { analyzeResumeText, extractResumeText } from "./local-resume-analysis";

type WorkerRequest = {
  type: "analyze";
  requestId: string;
  file: File;
  sourceFile: string;
  sourceSize: string;
  sourceFingerprint: string;
  jobProfile: JobProfile;
  candidateId: number;
};

type WorkerResponse =
  | {
      type: "success";
      requestId: string;
      candidate: Candidate;
    }
  | {
      type: "error";
      requestId: string;
      message: string;
    };

const DEFAULT_ANALYSIS_TIMEOUT_MS = 45_000;

const pending = new Map<
  string,
  {
    resolve: (candidate: Candidate) => void;
    reject: (error: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }
>();

let resumeWorker: Worker | null = null;

export async function analyzeResumeFileInWorker({
  file,
  sourceFile,
  sourceSize,
  sourceFingerprint,
  jobProfile,
  candidateId,
  timeoutMs = DEFAULT_ANALYSIS_TIMEOUT_MS,
}: {
  file: File;
  sourceFile: string;
  sourceSize: string;
  sourceFingerprint: string;
  jobProfile: JobProfile;
  candidateId: number;
  timeoutMs?: number;
}) {
  if (typeof Worker === "undefined") {
    const text = await extractResumeText(file);
    return {
      ...analyzeResumeText(text, sourceFile, sourceSize, jobProfile, candidateId),
      sourceFingerprint,
    };
  }

  const worker = getResumeWorker();
  const requestId = createRequestId();

  return new Promise<Candidate>((resolve, reject) => {
    const timeoutId = setTimeout(
      () => handleRequestTimeout(requestId, timeoutMs),
      timeoutMs,
    );

    pending.set(requestId, { resolve, reject, timeoutId });

    try {
      worker.postMessage({
        type: "analyze",
        requestId,
        file,
        sourceFile,
        sourceSize,
        sourceFingerprint,
        jobProfile,
        candidateId,
      } satisfies WorkerRequest);
    } catch (error) {
      pending.delete(requestId);
      clearTimeout(timeoutId);
      reject(
        error instanceof Error
          ? error
          : new Error("The CV could not be sent to the local analysis worker."),
      );
    }
  });
}

function getResumeWorker() {
  if (resumeWorker) return resumeWorker;

  resumeWorker = new Worker(new URL("./resume-worker.ts", import.meta.url), {
    type: "module",
  });
  resumeWorker.addEventListener("message", handleWorkerMessage);
  resumeWorker.addEventListener("error", handleWorkerError);
  resumeWorker.addEventListener("messageerror", handleWorkerMessageError);
  return resumeWorker;
}

function handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
  const entry = pending.get(event.data.requestId);
  if (!entry) return;

  pending.delete(event.data.requestId);
  clearTimeout(entry.timeoutId);
  if (event.data.type === "success") {
    entry.resolve(event.data.candidate);
    return;
  }
  entry.reject(new Error(event.data.message));
}

function handleWorkerError() {
  terminateWorkerAndRejectPending(
    new Error(
      "The local CV analysis worker failed. Try the file again or use a smaller text-based CV.",
    ),
  );
}

function handleWorkerMessageError() {
  terminateWorkerAndRejectPending(
    new Error(
      "The local CV analysis worker could not read the file data. Try a different PDF, DOCX, or TXT file.",
    ),
  );
}

function handleRequestTimeout(requestId: string, timeoutMs: number) {
  const entry = pending.get(requestId);
  if (!entry) return;

  pending.delete(requestId);
  clearTimeout(entry.timeoutId);
  entry.reject(
    new Error(
      `Local CV analysis timed out after ${Math.round(timeoutMs / 1000)} seconds. The file may be too large, corrupted, scanned, or unusually complex. Try a smaller text-based PDF, DOCX, or TXT file.`,
    ),
  );

  terminateWorkerAndRejectPending(
    new Error(
      "The local CV analysis worker was restarted because another file timed out. Please try this file again.",
    ),
  );
}

function terminateWorkerAndRejectPending(error: Error) {
  pending.forEach((entry) => {
    clearTimeout(entry.timeoutId);
    entry.reject(error);
  });
  pending.clear();
  resumeWorker?.terminate();
  resumeWorker = null;
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
