import type { Candidate, CandidateStatus } from "../data/mock-data";

const MAX_TEXT_LENGTH = 80_000;

const skillCatalog = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "SQL",
  "Postgres",
  "MongoDB",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "Figma",
  "Design Systems",
  "User Research",
  "Product Strategy",
  "Analytics",
  "Machine Learning",
  "Data Analysis",
  "Agile",
  "Leadership",
  "Accessibility",
];

const jobSkills: Record<string, string[]> = {
  "Senior Product Designer": [
    "Figma",
    "Design Systems",
    "User Research",
    "Product Strategy",
    "Leadership",
    "Accessibility",
  ],
  "Staff Frontend Engineer": [
    "React",
    "TypeScript",
    "JavaScript",
    "Accessibility",
    "Leadership",
    "Node.js",
  ],
};

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "txt") {
    return normalizeText(await file.text());
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === "docx") {
    return extractDocxText(bytes);
  }
  if (extension === "pdf") {
    return extractPdfText(bytes);
  }

  throw new Error("Unsupported file type");
}

export function analyzeResumeText(
  text: string,
  sourceFile: string,
  targetRole: string,
  id: number,
): Candidate {
  const normalized = normalizeText(text).slice(0, MAX_TEXT_LENGTH);
  if (normalized.length < 80) {
    throw new Error("Not enough readable text was found in this CV");
  }

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const name = findName(lines, sourceFile);
  const role = findRole(lines, targetRole);
  const email = normalized.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const phone = normalized.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/)?.[0];
  const location = findLocation(lines);
  const experienceYears = findExperienceYears(normalized);
  const tags = findSkills(normalized);
  const educationText = findEducation(normalized);
  const targetSkills = jobSkills[targetRole] ?? skillCatalog.slice(0, 8);
  const matchedTargetSkills = targetSkills.filter((skill) =>
    includesTerm(normalized, skill),
  );

  const skills = clamp(
    45 + matchedTargetSkills.length * 8 + Math.min(tags.length, 8) * 2,
    45,
    98,
  );
  const experience = clamp(
    48 + Math.min(experienceYears, 10) * 5 + countImpactSignals(normalized) * 2,
    45,
    97,
  );
  const education = educationText ? 82 : 58;
  const score = Math.round(skills * 0.45 + experience * 0.4 + education * 0.15);
  const status: CandidateStatus =
    score >= 85 ? "Hire" : score >= 70 ? "Review" : "Reject";

  const strengths = [
    matchedTargetSkills.length
      ? `Matches ${matchedTargetSkills.length} priority skills for ${targetRole}`
      : "Relevant transferable experience was detected",
    experienceYears > 0
      ? `${experienceYears}+ years of experience referenced`
      : "Practical experience is described in the CV",
    countImpactSignals(normalized) > 0
      ? "Includes measurable outcomes or delivery impact"
      : "Background is clearly structured",
  ];

  const weaknesses = [
    matchedTargetSkills.length < Math.ceil(targetSkills.length / 2)
      ? "Several priority job skills were not explicitly mentioned"
      : "",
    !educationText ? "Education details were not clearly identified" : "",
    countImpactSignals(normalized) === 0
      ? "Few measurable outcomes were found"
      : "",
  ].filter(Boolean);

  return {
    id,
    name,
    role,
    targetRole,
    location,
    email,
    phone,
    avatar: getInitials(name),
    color: "violet",
    score,
    skills,
    experience,
    education,
    status,
    submitted: "Just now",
    tags: tags.slice(0, 6),
    strengths,
    weaknesses: weaknesses.length
      ? weaknesses
      : ["Review role-specific expectations during the interview"],
    sourceFile,
    experienceYears,
    educationText,
    summary: `${name} shows a ${score >= 85 ? "strong" : score >= 70 ? "moderate" : "limited"} match for ${targetRole}. The local analysis found ${matchedTargetSkills.length} priority skills and ${experienceYears || "some"} years of referenced experience.`,
  };
}

async function extractDocxText(bytes: Uint8Array) {
  const entry = findZipEntry(bytes, "word/document.xml");
  if (!entry) {
    throw new Error("This DOCX file does not contain a readable document");
  }

  const content =
    entry.compressionMethod === 0
      ? entry.data
      : entry.compressionMethod === 8
        ? await decompress(entry.data, "deflate-raw")
        : null;

  if (!content) {
    throw new Error("This DOCX compression format is not supported");
  }

  const xml = new TextDecoder().decode(content);
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(document.getElementsByTagName("w:p")).map(
    (paragraph) =>
      Array.from(paragraph.getElementsByTagName("w:t"))
        .map((node) => node.textContent ?? "")
        .join(""),
  );

  return normalizeText(paragraphs.join("\n"));
}

async function extractPdfText(bytes: Uint8Array) {
  const source = new TextDecoder("latin1").decode(bytes);
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

  if (normalizeText(extracted).length < 80) {
    throw new Error(
      "No readable PDF text was found. Scanned PDFs require OCR, which is not available in browser-only mode.",
    );
  }

  return normalizeText(extracted);
}

function extractPdfTextOperators(source: string) {
  const output: string[] = [];
  const literalPattern = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  const arrayPattern = /\[((?:.|\r|\n)*?)\]\s*TJ/g;
  const hexPattern = /<([0-9a-fA-F]+)>\s*Tj/g;
  let match: RegExpExecArray | null;

  while ((match = literalPattern.exec(source))) {
    output.push(decodePdfLiteral(match[1]));
  }
  while ((match = arrayPattern.exec(source))) {
    const strings = Array.from(
      match[1].matchAll(/\(((?:\\.|[^\\)])*)\)/g),
      (part) => decodePdfLiteral(part[1]),
    );
    if (strings.length) output.push(strings.join(""));
  }
  while ((match = hexPattern.exec(source))) {
    output.push(decodePdfHex(match[1]));
  }

  return output;
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

function findZipEntry(bytes: Uint8Array, targetName: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findSignature(view, 0x06054b50);
  if (eocdOffset < 0) return null;

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) return null;
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(
      bytes.slice(offset + 46, offset + 46 + nameLength),
    );

    if (name === targetName) {
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset =
        localHeaderOffset + 30 + localNameLength + localExtraLength;
      return {
        compressionMethod,
        data: bytes.slice(dataOffset, dataOffset + compressedSize),
      };
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return null;
}

function findSignature(view: DataView, signature: number) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === signature) return offset;
  }
  return -1;
}

async function decompress(
  bytes: Uint8Array,
  format: CompressionFormat,
): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findName(lines: string[], sourceFile: string) {
  const candidate = lines.find(
    (line) =>
      line.length >= 3 &&
      line.length <= 60 &&
      /^[A-Za-zÀ-ž][A-Za-zÀ-ž .'-]+$/.test(line) &&
      !/(resume|curriculum|vitae|profile|summary|experience)/i.test(line),
  );
  if (candidate) return titleCase(candidate);

  return titleCase(
    sourceFile
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b(cv|resume)\b/gi, ""),
  );
}

function findRole(lines: string[], fallback: string) {
  return (
    lines.find(
      (line) =>
        line.length <= 80 &&
        /(engineer|designer|manager|scientist|developer|researcher|analyst|architect|specialist|director)/i.test(
          line,
        ),
    ) ?? fallback
  );
}

function findLocation(lines: string[]) {
  return (
    lines.find(
      (line) =>
        line.length <= 70 &&
        (/\b(remote|hybrid)\b/i.test(line) ||
          /\b[A-Za-z .'-]+,\s*[A-Z]{2}\b/.test(line)),
    ) ?? "Location not specified"
  );
}

function findExperienceYears(text: string) {
  const explicit = Array.from(
    text.matchAll(/(\d{1,2})\+?\s+years?(?:\s+of)?\s+experience/gi),
    (match) => Number(match[1]),
  );
  if (explicit.length) return Math.max(...explicit);

  const years = Array.from(
    text.matchAll(/\b(19|20)\d{2}\b/g),
    (match) => Number(match[0]),
  ).filter((year) => year <= new Date().getFullYear());
  if (years.length >= 2) {
    return Math.min(40, Math.max(...years) - Math.min(...years));
  }
  return 0;
}

function findEducation(text: string) {
  const match = text.match(
    /(?:bachelor|master|phd|doctorate|university|college|b\.?sc|m\.?sc|mba)[^\n]{0,100}/i,
  );
  return match?.[0];
}

function findSkills(text: string) {
  return skillCatalog.filter((skill) => includesTerm(text, skill));
}

function includesTerm(text: string, term: string) {
  return text.toLowerCase().includes(term.toLowerCase());
}

function countImpactSignals(text: string) {
  return Math.min(
    8,
    (text.match(/\b\d+(?:\.\d+)?%|\b\d+[kKmM]\+?\b|\b(increased|reduced|improved|grew|saved|led|launched|delivered)\b/gi) ?? [])
      .length,
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
