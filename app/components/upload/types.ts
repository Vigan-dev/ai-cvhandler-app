export type UploadStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "complete"
  | "error";

export type UploadFile = {
  id: number;
  name: string;
  size: string;
  fingerprint: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  errorDetail?: string;
  canPasteText?: boolean;
  manualText?: string;
};

export type AnalysisResult = {
  completed: number;
  failed: number;
};
