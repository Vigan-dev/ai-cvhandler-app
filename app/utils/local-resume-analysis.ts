import { extractDocxText } from "./resume-extractors/docx.ts";
import { extractPdfText } from "./resume-extractors/pdf.ts";
import { normalizeText } from "./resume-extractors/shared.ts";
import {
  ResumeExtractionError,
  type ResumeExtractionResult,
} from "./resume-extractors/types.ts";
import type { ExtractionConfidence } from "../data/mock-data.ts";
export { analyzeResumeText } from "./resume-analysis/scoring.ts";
export { matchesSkill } from "./resume-analysis/skills.ts";
export { ResumeExtractionError } from "./resume-extractors/types.ts";

export async function extractResumeText(
  file: File,
): Promise<ResumeExtractionResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "txt") {
    const text = await file.text();
    if (text.includes("\u0000")) {
      throw new ResumeExtractionError(
        "This TXT file appears to contain binary data.",
        "The file contains binary characters, so it is not safe to treat it as readable resume text.",
      );
    }
    return buildExtractionResult(normalizeText(text), "TXT text extraction");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === "docx") {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new ResumeExtractionError(
        "This file is not a valid DOCX document.",
        "The DOCX package header is missing or corrupted.",
      );
    }
    return buildExtractionResult(
      await extractDocxText(bytes),
      "DOCX XML text extraction",
    );
  }
  if (extension === "pdf") {
    if (new TextDecoder("latin1").decode(bytes.slice(0, 5)) !== "%PDF-") {
      throw new ResumeExtractionError(
        "This file is not a valid PDF document.",
        "The PDF header is missing or corrupted.",
      );
    }
    return extractPdfText(bytes);
  }

  throw new ResumeExtractionError(
    "Unsupported file type.",
    "CV-Handler can read PDF, DOCX, and TXT files only.",
  );
}

export function buildManualExtractionResult(
  text: string,
): ResumeExtractionResult {
  return buildExtractionResult(normalizeText(text), "Text pasted manually", [
    "The original file text could not be read automatically, so this profile was scored from pasted text.",
  ]);
}

function buildExtractionResult(
  text: string,
  method: string,
  extraNotes: string[] = [],
): ResumeExtractionResult {
  const normalized = normalizeText(text);
  const confidence = getExtractionConfidence(normalized);

  if (normalized.length < 80) {
    throw new ResumeExtractionError(
      "Not enough readable resume text was found.",
      `Only ${normalized.length} readable characters were found. The file may be scanned, image-based, locked, or exported without a text layer.`,
    );
  }

  return {
    text: normalized,
    confidence,
    notes: [
      `${method}: ${normalized.length.toLocaleString()} readable characters found.`,
      ...extraNotes,
    ],
  };
}

function getExtractionConfidence(text: string): ExtractionConfidence {
  if (text.length >= 1_200) return "High";
  if (text.length >= 350) return "Medium";
  return "Low";
}
