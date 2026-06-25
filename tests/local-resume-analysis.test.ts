import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultJobProfiles,
  normalizeWeights,
} from "../app/data/job-profiles.ts";
import {
  analyzeResumeText,
  matchesSkill,
} from "../app/utils/local-resume-analysis.ts";

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
  assert.equal(weak.status, "Reject");
});
