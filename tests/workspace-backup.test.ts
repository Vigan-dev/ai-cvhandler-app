import assert from "node:assert/strict";
import test from "node:test";
import { defaultJobProfiles } from "../app/data/job-profiles.ts";
import { candidates } from "../app/data/mock-data.ts";
import {
  createWorkspaceBackup,
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

  assert.equal(restored.schemaVersion, 1);
  assert.equal(restored.data.candidates.length, 2);
  assert.equal(restored.data.selectedJobId, defaultJobProfiles[0].id);
  assert.equal(restored.data.preferences["talentlens-theme"], "dark");
});

test("workspace restore rejects malformed or inconsistent data", () => {
  assert.throws(
    () => parseWorkspaceBackup("{not-json"),
    /not valid JSON/,
  );

  const backup = createWorkspaceBackup({
    candidates: [],
    jobProfiles: defaultJobProfiles,
    selectedJobId: "missing-profile",
    notifications: [],
    preferences: {},
  });

  assert.throws(
    () => parseWorkspaceBackup(serializeWorkspaceBackup(backup)),
    /missing selected job profile/,
  );
});
