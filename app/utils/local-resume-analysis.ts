import { extractDocxText } from "./resume-extractors/docx.ts";
import { extractPdfText } from "./resume-extractors/pdf.ts";
import { normalizeText } from "./resume-extractors/shared.ts";
export { analyzeResumeText } from "./resume-analysis/scoring.ts";
export { matchesSkill } from "./resume-analysis/skills.ts";

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "txt") {
    const text = await file.text();
    if (text.includes("\u0000")) {
      throw new Error("This TXT file appears to contain binary data");
    }
    return normalizeText(text);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === "docx") {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new Error("This file is not a valid DOCX document");
    }
    return extractDocxText(bytes);
  }
  if (extension === "pdf") {
    if (new TextDecoder("latin1").decode(bytes.slice(0, 5)) !== "%PDF-") {
      throw new Error("This file is not a valid PDF document");
    }
    return extractPdfText(bytes);
  }

  throw new Error("Unsupported file type");
}
