import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultJobProfiles,
  normalizeWeights,
} from "../app/data/job-profiles.ts";
import {
  ResumeExtractionError,
  analyzeResumeText,
  extractResumeText,
  matchesSkill,
} from "../app/utils/local-resume-analysis.ts";
import { ANALYSIS_VERSION } from "../app/data/mock-data.ts";
import {
  frontendFalsePositiveResume,
  frontendStrictMissingRequiredResume,
  frontendStrongAliasResume,
} from "./fixtures/resume-scoring-fixtures.ts";

const frontendProfile = defaultJobProfiles.find(
  (profile) => profile.id === "staff-frontend-engineer",
);

if (!frontendProfile) {
  throw new Error("The frontend test job profile is missing.");
}

test("skill matching respects word boundaries and aliases", () => {
  assert.equal(matchesSkill("Built services with Java.", "Java"), true);
  assert.equal(matchesSkill("Built interfaces with JavaScript.", "Java"), false);
  assert.equal(matchesSkill("Used NoSQL databases.", "SQL"), false);
  assert.equal(matchesSkill("Production NodeJS APIs.", "Node.js"), true);
  assert.equal(
    matchesSkill("Built typed JavaScript systems.", "TypeScript", [
      "typed javascript",
    ]),
    true,
  );
});

test("PDF extraction reports likely scanned files before scoring", async () => {
  const scannedPdf = new File(
    [
      "%PDF-1.7\n1 0 obj\n<< /Type /XObject /Subtype /Image /Width 100 /Height 100 >>\nendobj\n%%EOF",
    ],
    "scanned.pdf",
    { type: "application/pdf" },
  );

  await assert.rejects(
    () => extractResumeText(scannedPdf),
    (error) =>
      error instanceof ResumeExtractionError &&
      error.message.includes("scanned") &&
      error.reason.includes("no clear font or text-layer signals"),
  );
});

test("TXT extraction returns confidence separate from scoring", async () => {
  const textFile = new File(
    [
      `Jordan Lee
      Staff Frontend Engineer
      10 years of React and TypeScript architecture experience.
      Built accessible design systems and improved performance by 42%.
      BSc Computer Science.
      `.repeat(10),
    ],
    "jordan.txt",
    { type: "text/plain" },
  );

  const extraction = await extractResumeText(textFile);

  assert.equal(extraction.confidence, "High");
  assert.ok(extraction.notes[0].includes("readable characters"));
});

test("weight normalization always produces a 100 percent total", () => {
  const weights = normalizeWeights({
    skills: 10,
    experience: 10,
    education: 0,
    impact: 0,
  });

  assert.equal(
    Math.round(
      weights.skills +
        weights.experience +
        weights.education +
        weights.impact,
    ),
    100,
  );
  assert.equal(weights.skills, 50);
  assert.equal(weights.experience, 50);
});

test("profile scoring rewards explicit role evidence", () => {
  const strong = analyzeResumeText(
    `Jordan Lee
    Staff Frontend Engineer
    jordan@example.com
    Austin, TX
    10 years of experience building accessible web products.
    Led React and TypeScript architecture across a design system.
    Improved page performance by 42% and mentored 8 engineers.
    JavaScript, Node.js, WCAG accessibility, testing, system design.
    BSc Computer Science, Example University.`,
    "jordan-lee.txt",
    "2 KB",
    frontendProfile,
    100,
  );
  const weak = analyzeResumeText(
    `Taylor Morgan
    Customer Support Specialist
    taylor@example.com
    Remote
    Three years supporting customers and documenting common questions.
    Coordinated schedules, prepared reports, and communicated with teams.
    Bachelor of Arts, Example College.`,
    "taylor-morgan.txt",
    "1 KB",
    frontendProfile,
    101,
  );

  assert.ok(strong.score > weak.score);
  assert.ok(strong.matchedRequiredSkills?.includes("React"));
  assert.ok(strong.matchedRequiredSkills?.includes("TypeScript"));
  assert.equal(strong.targetJobId, frontendProfile.id);
  assert.equal(weak.status, "low_evidence");
  assert.equal(strong.analysisVersion, ANALYSIS_VERSION);
});

test("custom aliases reduce false negatives", () => {
  const candidate = analyzeResumeText(
    frontendStrongAliasResume,
    "frontend-alias.txt",
    "2 KB",
    {
      ...frontendProfile,
      skillAliases: {
        ...frontendProfile.skillAliases,
        TypeScript: ["typed JavaScript"],
      },
    },
    102,
  );

  assert.ok(candidate.matchedRequiredSkills?.includes("TypeScript"));
  assert.equal(candidate.status, "strong_match");
});

test("strict required skills reject thin matches even with seniority", () => {
  const candidate = analyzeResumeText(
    frontendStrictMissingRequiredResume,
    "frontend-missing-required.txt",
    "2 KB",
    {
      ...frontendProfile,
      requiredSkillStrictness: "strict",
    },
    103,
  );

  assert.equal(candidate.status, "low_evidence");
  assert.ok(candidate.missingRequiredSkills?.includes("React"));
  assert.ok(candidate.missingRequiredSkills?.includes("TypeScript"));
});

test("fixtures catch common false positives", () => {
  const candidate = analyzeResumeText(
    frontendFalsePositiveResume,
    "frontend-false-positive.txt",
    "2 KB",
    frontendProfile,
    104,
  );

  assert.equal(candidate.matchedRequiredSkills?.includes("JavaScript"), false);
  assert.equal(candidate.matchedRequiredSkills?.includes("TypeScript"), false);
  assert.equal(candidate.status, "low_evidence");
});
