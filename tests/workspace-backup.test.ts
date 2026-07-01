import assert from "node:assert/strict";
import test from "node:test";
import { defaultJobProfiles } from "../app/data/job-profiles.ts";
import { candidates } from "../app/data/mock-data.ts";
import {
  createWorkspaceBackup,
  WORKSPACE_BACKUP_VERSION,
  parseWorkspaceBackup,
  serializeWorkspaceBackup,
} from "../app/utils/workspace-backup.ts";

test("workspace backups round-trip through JSON", () => {
  const backup = createWorkspaceBackup({
    candidates: candidates.slice(0, 2),
    jobProfiles: defaultJobProfiles,
    selectedJobId: defaultJobProfiles[0].id,
    notifications: [
      {
        id: "test",
        title: "Backup test",
        detail: "Local data",
        href: "/settings",
        read: false,
        createdAt: "2026-06-25T12:00:00.000Z",
      },
    ],
    preferences: {
      "talentlens-theme": "dark",
      "talentlens-retention-days": 90,
    },
  });
  const restored = parseWorkspaceBackup(serializeWorkspaceBackup(backup));

  assert.equal(restored.product, "CV-Handler");
  assert.equal(restored.schemaVersion, WORKSPACE_BACKUP_VERSION);
  assert.equal(restored.data.candidates.length, 2);
  assert.equal(restored.data.selectedJobId, defaultJobProfiles[0].id);
  assert.equal(restored.data.preferences["talentlens-theme"], "dark");
});

test("workspace restore migrates older backup shapes before validation", () => {
  const restored = parseWorkspaceBackup(
    JSON.stringify({
      product: "TalentLens",
      exportedAt: "2026-06-25T12:00:00.000Z",
      data: {
        candidates: [
          {
            id: 9,
            name: "Legacy Candidate",
            role: "Engineer",
            location: "Remote",
            avatar: "LC",
            color: "violet",
            score: 72,
            skills: 70,
            experience: 75,
            education: 60,
            status: "Review",
            tags: [],
            strengths: [],
            weaknesses: [],
            submitted: "Imported",
          },
        ],
        jobProfiles: [
          {
            id: "legacy-role",
            name: "Legacy Role",
            description: "Old backup role",
            requiredSkills: ["React"],
            optionalSkills: [],
            minimumExperienceYears: 3,
            educationKeywords: [],
            weights: { skills: 50, experience: 30, education: 10, impact: 10 },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        preferences: {
          "talentlens-theme": "system",
          "talentlens-candidate-view": "list",
        },
      },
    }),
  );

  assert.equal(restored.schemaVersion, WORKSPACE_BACKUP_VERSION);
  assert.equal(restored.data.candidates[0].status, "needs_review");
  assert.equal(restored.data.candidates[0].stage, "New");
  assert.equal(restored.data.selectedJobId, "legacy-role");
  assert.deepEqual(restored.data.notifications, []);
  assert.equal(restored.data.jobProfiles[0].requiredSkillStrictness, "balanced");
  assert.equal(restored.data.preferences["talentlens-theme"], "light");
  assert.equal(restored.data.preferences["talentlens-candidate-view"], "table");
});

test("workspace restore repairs a missing selected job profile", () => {
  const backup = createWorkspaceBackup({
    candidates: [],
    jobProfiles: defaultJobProfiles,
    selectedJobId: "missing-profile",
    notifications: [],
    preferences: {},
  });
  const restored = parseWorkspaceBackup(serializeWorkspaceBackup(backup));

  assert.equal(restored.data.selectedJobId, defaultJobProfiles[0].id);
});

test("workspace restore rejects malformed data", () => {
  assert.throws(
    () => parseWorkspaceBackup("{not-json"),
    /not valid JSON/,
  );
});
