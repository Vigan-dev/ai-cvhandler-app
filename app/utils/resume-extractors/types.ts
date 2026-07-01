import type { ExtractionConfidence } from "../../data/mock-data.ts";

export type ResumeExtractionResult = {
  text: string;
  confidence: ExtractionConfidence;
  notes: string[];
};

export class ResumeExtractionError extends Error {
  canPasteText = true;
  reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = "ResumeExtractionError";
    this.reason = reason;
  }
}
