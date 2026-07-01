import { decompress, normalizeText } from "./shared.ts";
import {
  ResumeExtractionError,
  type ResumeExtractionResult,
} from "./types.ts";

export async function extractPdfText(
  bytes: Uint8Array,
): Promise<ResumeExtractionResult> {
  const source = new TextDecoder("latin1").decode(bytes);
  if (!source.includes("%%EOF")) {
    throw new ResumeExtractionError(
      "This PDF appears to be incomplete or corrupted.",
      "The PDF end marker is missing, so the browser parser cannot trust the file structure.",
    );
  }

  const scanRisk = getLikelyScannedPdfReason(source);
  if (scanRisk) {
    throw new ResumeExtractionError(
      "This PDF looks scanned or image-based.",
      scanRisk,
    );
  }

  const chunks = [source];
  const streamPattern = /stream\r?\n/g;
  let match: RegExpExecArray | null;

  while ((match = streamPattern.exec(source))) {
    const start = match.index + match[0].length;
    const end = source.indexOf("endstream", start);
    if (end < 0) break;

    const header = source.slice(Math.max(0, match.index - 300), match.index);
    if (header.includes("/FlateDecode")) {
      let streamBytes = bytes.slice(start, end);
      while (
        streamBytes.length &&
        (streamBytes[streamBytes.length - 1] === 10 ||
          streamBytes[streamBytes.length - 1] === 13)
      ) {
        streamBytes = streamBytes.slice(0, -1);
      }
      try {
        const inflated = await decompress(streamBytes, "deflate");
        chunks.push(new TextDecoder("latin1").decode(inflated));
      } catch {
        // Continue with any other readable PDF streams.
      }
    }
    streamPattern.lastIndex = end + 9;
  }

  const extracted = chunks
    .flatMap((chunk) => extractPdfTextOperators(chunk))
    .join("\n");

  const normalized = normalizeText(extracted);
  if (normalized.length < 80) {
    throw new ResumeExtractionError(
      "No readable PDF text was found.",
      `Only ${normalized.length} readable characters were found after checking PDF text operators. Scanned PDFs require OCR, which is not available in browser-only mode.`,
    );
  }

  return {
    text: normalized,
    confidence:
      normalized.length >= 1_200
        ? "High"
        : normalized.length >= 350
          ? "Medium"
          : "Low",
    notes: [
      `PDF text extraction: ${normalized.length.toLocaleString()} readable characters found.`,
    ],
  };
}

function getLikelyScannedPdfReason(source: string) {
  const imageCount = countMatches(source, /\/Subtype\s*\/Image\b/g);
  const hasTextLayerSignals =
    /\/Font\b|\/ToUnicode\b|\/Type0\b|\/TrueType\b|\/CIDFont/i.test(source);
  const visibleTextOperators = countMatches(
    source,
    /\b(?:Tj|TJ|Tf|BT|ET)\b/g,
  );

  if (imageCount >= 1 && !hasTextLayerSignals && visibleTextOperators < 2) {
    return [
      `The PDF contains ${imageCount} image object${imageCount === 1 ? "" : "s"}`,
      "but no clear font or text-layer signals.",
      "It was likely scanned from paper or exported as images.",
    ].join(" ");
  }

  return "";
}

function countMatches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

function extractPdfTextOperators(source: string) {
  const output: string[] = [];
  const operatorPattern =
    /\[((?:.|\r|\n)*?)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*(?:Tj|')|(?:[-+]?\d*\.?\d+\s+){2}\(((?:\\.|[^\\)])*)\)\s*"|<([0-9a-fA-F]+)>\s*Tj|\bT\*|[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+\s+T[dD]/g;
  let match: RegExpExecArray | null;

  while ((match = operatorPattern.exec(source))) {
    if (match[1]) {
      const strings = Array.from(
        match[1].matchAll(/\(((?:\\.|[^\\)])*)\)/g),
        (part) => decodePdfLiteral(part[1]),
      );
      if (strings.length) output.push(strings.join(""));
      continue;
    }
    if (match[2] || match[3]) {
      output.push(decodePdfLiteral(match[2] ?? match[3]));
      continue;
    }
    if (match[4]) {
      output.push(decodePdfHex(match[4]));
      continue;
    }
    output.push("\n");
  }

  if (output.length === 0) {
    const fallbackLiteralPattern = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
    return Array.from(
      source.matchAll(fallbackLiteralPattern),
      (part) => decodePdfLiteral(part[1]),
    );
  }

  return output.join(" ").split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, escaped: string) => {
      const replacements: Record<string, string> = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        "(": "(",
        ")": ")",
        "\\": "\\",
      };
      return replacements[escaped];
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8)),
    );
}

function decodePdfHex(value: string) {
  const bytes = value.match(/.{1,2}/g)?.map((pair) => Number.parseInt(pair, 16));
  if (!bytes?.length) return "";
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let result = "";
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      result += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return result;
  }
  return new TextDecoder("latin1").decode(new Uint8Array(bytes));
}
