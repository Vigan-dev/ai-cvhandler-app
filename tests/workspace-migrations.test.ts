import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYSIS_VERSION,
  type Candidate,
} from "../app/data/mock-data.ts";
import {
  migrateWorkspaceValue,
  WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_STORAGE_KEYS,
} from "../app/utils/workspace-migrations.ts";

test("candidate migration adds missing modern fields", () => {
  const result = migrateWorkspaceValue(WORKSPACE_STORAGE_KEYS.candidates, [
    {
      id: "42",
      name: "Legacy Candidate",
      role: "Frontend Engineer",
      location: "Remote",
      score: 81,
      skills: 80,
      experience: 78,
      education: 70,
      status: "Hire",
      tags: ["React"],
      strengths: ["Relevant frontend experience"],
      weaknesses: [],
    },
  ]);
  const candidates = result.value as Candidate[];

  assert.equal(result.migrated, true);
  assert.equal(candidates[0].id, 42);
  assert.equal(candidates[0].status, "strong_match");
  assert.equal(candidates[0].stage, "Review");
  assert.equal(candidates[0].analysisVersion, ANALYSIS_VERSION);
  assert.equal(candidates[0].notes, "");
});

test("job profile migration adds strictness, aliases, and normalized weights", () => {
  const result = migrateWorkspaceValue(WORKSPACE_STORAGE_KEYS.jobProfiles, [
    {
      id: "legacy-engineer",
      name: "Legacy Engineer",
      description: "Old profile",
      requiredSkills: "React, TypeScript",
      optionalSkills: ["Testing"],
      minimumExperienceYears: "5",
      educationKeywords: "computer science",
      weights: { skills: 5, experience: 5, education: 0, impact: 0 },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
  const [profile] = result.value as Array<{
    requiredSkillStrictness: string;
    skillAliases: Record<string, string[]>;
    weights: Record<string, number>;
  }>;

  assert.equal(result.migrated, true);
  assert.equal(profile.requiredSkillStrictness, "balanced");
  assert.deepEqual(profile.skillAliases, {});
  assert.equal(profile.weights.skills, 50);
  assert.equal(profile.weights.experience, 50);
});

test("preference migration normalizes unsafe values", () => {
  assert.equal(
    migrateWorkspaceValue(WORKSPACE_STORAGE_KEYS.theme, "system").value,
    "light",
  );
  assert.equal(
    migrateWorkspaceValue(WORKSPACE_STORAGE_KEYS.candidateView, "list").value,
    "table",
  );
  assert.equal(
    migrateWorkspaceValue(WORKSPACE_STORAGE_KEYS.candidateMinimumScore, "140")
      .value,
    100,
  );
  assert.equal(
    migrateWorkspaceValue("talentlens-workspace-schema-version", 1).value,
    WORKSPACE_SCHEMA_VERSION,
  );
});
