import {
  normalizeWeights,
  type JobProfile,
} from "../data/job-profiles.ts";
import type {
  AnalysisConfidence,
  Candidate,
  CandidateStatus,
} from "../data/mock-data.ts";

const MAX_TEXT_LENGTH = 80_000;
const MAX_DECOMPRESSED_BYTES = 16 * 1024 * 1024;

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
  "Testing",
  "Architecture",
  "Statistics",
  "Usability",
  "Workshop Facilitation",
  "A/B Testing",
  "B2B SaaS",
  "Prototyping",
];

const skillAliases: Record<string, string[]> = {
  React: ["react", "react.js", "reactjs"],
  TypeScript: ["typescript", "ts"],
  JavaScript: ["javascript", "js", "ecmascript"],
  "Node.js": ["node.js", "nodejs", "node js"],
  Python: ["python"],
  Java: ["java"],
  "C#": ["c#", "c sharp"],
  SQL: ["sql", "structured query language"],
  Postgres: ["postgres", "postgresql"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure", "microsoft azure"],
  Docker: ["docker", "containers"],
  Kubernetes: ["kubernetes", "k8s"],
  Figma: ["figma"],
  "Design Systems": ["design system", "design systems"],
  "User Research": ["user research", "ux research", "customer research"],
  "Product Strategy": ["product strategy", "product vision", "roadmapping"],
  Analytics: ["analytics", "product analytics", "web analytics"],
  "Machine Learning": ["machine learning", "ml"],
  "Data Analysis": ["data analysis", "data analytics"],
  Agile: ["agile", "scrum", "kanban"],
  Leadership: ["leadership", "team lead", "mentoring", "managed a team"],
  Accessibility: ["accessibility", "wcag", "a11y"],
  Testing: ["testing", "unit tests", "integration tests", "test automation"],
  Architecture: ["architecture", "system design", "technical design"],
  Statistics: ["statistics", "statistical"],
  Usability: ["usability", "usability testing"],
  "Workshop Facilitation": ["workshop facilitation", "facilitated workshops"],
  "A/B Testing": ["a/b testing", "ab testing", "experimentation"],
  "B2B SaaS": ["b2b saas", "enterprise saas"],
  Prototyping: ["prototyping", "prototype", "wireframing"],
};

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

export function analyzeResumeText(
  text: string,
  sourceFile: string,
  sourceSize: string,
  jobProfile: JobProfile,
  id: number,
): Candidate {
  const normalized = normalizeText(text).slice(0, MAX_TEXT_LENGTH);
  if (normalized.length < 80) {
    throw new Error("Not enough readable text was found in this CV");
  }

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const name = findName(lines, sourceFile);
  const role = findRole(lines, jobProfile.name);
  const email = normalized.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const phone = normalized.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/)?.[0];
  const location = findLocation(lines);
  const experienceYears = findExperienceYears(normalized);
  const tags = findSkills(normalized);
  const educationText = findEducation(normalized);
  const matchedRequiredSkills = jobProfile.requiredSkills.filter((skill) =>
    matchesSkill(normalized, skill),
  );
  const missingRequiredSkills = jobProfile.requiredSkills.filter(
    (skill) => !matchedRequiredSkills.includes(skill),
  );
  const matchedOptionalSkills = jobProfile.optionalSkills.filter((skill) =>
    matchesSkill(normalized, skill),
  );
  const requiredRatio = ratio(
    matchedRequiredSkills.length,
    jobProfile.requiredSkills.length,
    1,
  );
  const optionalRatio = ratio(
    matchedOptionalSkills.length,
    jobProfile.optionalSkills.length,
    1,
  );
  const skills = Math.round(
    clamp(requiredRatio * 80 + optionalRatio * 15 + Math.min(tags.length, 10), 0, 100),
  );
  const experience =
    experienceYears > 0
      ? Math.round(
          clamp(
            ratio(
              experienceYears,
              Math.max(1, jobProfile.minimumExperienceYears),
              1,
            ) *
              85 +
              Math.min(countImpactSignals(normalized) * 3, 15),
            0,
            100,
          ),
        )
      : 35;
  const educationKeywordMatches = jobProfile.educationKeywords.filter(
    (keyword) => matchesPhrase(normalized, keyword),
  );
  const education =
    jobProfile.educationKeywords.length === 0
      ? educationText
        ? 85
        : 65
      : educationKeywordMatches.length > 0
        ? 95
        : educationText
          ? 60
          : 25;
  const impactSignalCount = countImpactSignals(normalized);
  const impact = Math.round(clamp(impactSignalCount * 12.5, 0, 100));
  const weights = normalizeWeights(jobProfile.weights);
  const score = Math.round(
    (skills * weights.skills +
      experience * weights.experience +
      education * weights.education +
      impact * weights.impact) /
      100,
  );
  const status: CandidateStatus =
    score >= 80 && requiredRatio >= 0.65
      ? "Hire"
      : score >= 58
        ? "Review"
        : "Reject";
  const analysisConfidence = getAnalysisConfidence({
    email,
    experienceYears,
    educationText,
    detectedSkillCount: tags.length,
    textLength: normalized.length,
  });

  const strengths = [
    matchedRequiredSkills.length
      ? `Matches ${matchedRequiredSkills.length} of ${jobProfile.requiredSkills.length} required skills for ${jobProfile.name}`
      : "Relevant transferable experience was detected",
    experienceYears > 0
      ? `${experienceYears}+ years of experience referenced`
      : "Practical experience is described in the CV",
    impactSignalCount > 0
      ? `Includes ${impactSignalCount} measurable outcome or delivery signals`
      : "Background is clearly structured",
  ];

  const weaknesses = [
    missingRequiredSkills.length > 0
      ? `Missing explicit evidence for: ${missingRequiredSkills.join(", ")}`
      : "",
    !educationText ? "Education details were not clearly identified" : "",
    impactSignalCount === 0
      ? "Few measurable outcomes were found"
      : "",
  ].filter(Boolean);
  const scoreReasons = [
    `Skills: ${skills}/100 from ${matchedRequiredSkills.length}/${jobProfile.requiredSkills.length} required and ${matchedOptionalSkills.length}/${jobProfile.optionalSkills.length} optional matches.`,
    experienceYears > 0
      ? `Experience: ${experience}/100 from ${experienceYears} referenced years against a ${jobProfile.minimumExperienceYears}-year target.`
      : "Experience: duration could not be determined reliably.",
    educationText
      ? `Education: ${education}/100 from detected education details.`
      : "Education: no clear education details were detected.",
    `Impact: ${impact}/100 from ${impactSignalCount} measurable outcome signals.`,
  ];

  return {
    id,
    name,
    role,
    targetRole: jobProfile.name,
    targetJobId: jobProfile.id,
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
    stage: status === "Reject" ? "Rejected" : "New",
    submitted: "Just now",
    tags: tags.slice(0, 6),
    strengths,
    weaknesses: weaknesses.length
      ? weaknesses
      : ["Review role-specific expectations during the interview"],
    sourceFile,
    sourceSize,
    experienceYears,
    educationText,
    notes: "",
    analyzedAt: new Date().toISOString(),
    analysisConfidence,
    scoreReasons,
    matchedRequiredSkills,
    missingRequiredSkills,
    summary: `${name} shows a ${score >= 80 ? "strong" : score >= 58 ? "moderate" : "limited"} match for ${jobProfile.name}. The local analysis found ${matchedRequiredSkills.length} required skills and ${experienceYears || "an undetermined number of"} years of referenced experience.`,
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
  if (bytes.byteLength < 22) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findSignature(view, 0x06054b50);
  if (eocdOffset < 0) return null;

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset < 0 || offset + 46 > view.byteLength) return null;
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
      if (localHeaderOffset < 0 || localHeaderOffset + 30 > view.byteLength) {
        return null;
      }
      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) return null;
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset =
        localHeaderOffset + 30 + localNameLength + localExtraLength;
      if (
        dataOffset < 0 ||
        dataOffset + compressedSize > bytes.byteLength
      ) {
        return null;
      }
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
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) break;

    totalLength += result.value.byteLength;
    if (totalLength > MAX_DECOMPRESSED_BYTES) {
      await reader.cancel();
      throw new Error("The document expands beyond the safe local size limit");
    }
    chunks.push(result.value);
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return output;
}

function findName(lines: string[], sourceFile: string) {
  const candidate = lines.find(
    (line) =>
      line.length >= 3 &&
      line.length <= 60 &&
      /^\p{L}[\p{L} .'-]+$/u.test(line) &&
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
  return skillCatalog.filter((skill) => matchesSkill(text, skill));
}

export function matchesSkill(text: string, skill: string) {
  const aliases = skillAliases[skill] ?? [skill];
  return aliases.some((alias) => matchesPhrase(text, alias));
}

function matchesPhrase(text: string, phrase: string) {
  const normalizedText = normalizeForMatching(text);
  const normalizedPhrase = normalizeForMatching(phrase);
  const escapedPhrase = escapeRegExp(normalizedPhrase).replace(
    /\s+/g,
    "\\s+",
  );
  const pattern = new RegExp(
    `(?:^|[^a-z0-9+#])${escapedPhrase}(?=$|[^a-z0-9+#])`,
    "i",
  );
  return pattern.test(normalizedText);
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

function ratio(value: number, target: number, maximum: number) {
  if (target <= 0) return maximum;
  return Math.min(maximum, value / target);
}

function normalizeForMatching(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAnalysisConfidence(input: {
  email?: string;
  experienceYears: number;
  educationText?: string;
  detectedSkillCount: number;
  textLength: number;
}): AnalysisConfidence {
  const signals =
    Number(Boolean(input.email)) +
    Number(input.experienceYears > 0) +
    Number(Boolean(input.educationText)) +
    Number(input.detectedSkillCount >= 3) +
    Number(input.textLength >= 500);

  if (signals >= 4) return "High";
  if (signals >= 2) return "Medium";
  return "Low";
}
