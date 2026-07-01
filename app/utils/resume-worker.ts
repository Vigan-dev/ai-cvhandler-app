import type { JobProfile } from "../data/job-profiles.ts";
import type { Candidate } from "../data/mock-data.ts";
import {
  ResumeExtractionError,
  analyzeResumeText,
  extractResumeText,
} from "./local-resume-analysis.ts";

type ResumeWorkerRequest = {
  type: "analyze";
  requestId: string;
  file: File;
  sourceFile: string;
  sourceSize: string;
  sourceFingerprint: string;
  jobProfile: JobProfile;
  candidateId: number;
};

type ResumeWorkerResponse =
  | {
      type: "success";
      requestId: string;
      candidate: Candidate;
    }
  | {
      type: "error";
      requestId: string;
      message: string;
      reason?: string;
      canPasteText?: boolean;
    };

type WorkerScope = {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<ResumeWorkerRequest>) => void,
  ): void;
  postMessage(message: ResumeWorkerResponse): void;
};

const workerScope = globalThis as unknown as WorkerScope;

workerScope.addEventListener("message", (event) => {
  void analyze(event.data);
});

async function analyze(message: ResumeWorkerRequest) {
  if (message.type !== "analyze") return;

  try {
    const extraction = await extractResumeText(message.file);
    const candidate = analyzeResumeText(
      extraction.text,
      message.sourceFile,
      message.sourceSize,
      message.jobProfile,
      message.candidateId,
    );

    workerScope.postMessage({
      type: "success",
      requestId: message.requestId,
      candidate: {
        ...candidate,
        sourceFingerprint: message.sourceFingerprint,
        extractionConfidence: extraction.confidence,
        extractionNotes: extraction.notes,
      },
    });
  } catch (error) {
    const extractionError =
      error instanceof ResumeExtractionError ? error : null;
    workerScope.postMessage({
      type: "error",
      requestId: message.requestId,
      message:
        error instanceof Error
          ? error.message
          : "The CV could not be analyzed",
      reason: extractionError?.reason,
      canPasteText: extractionError?.canPasteText,
    });
  }
}
