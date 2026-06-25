"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { CANDIDATES_STORAGE_KEY, useCandidates } from "../hooks/use-candidates";
import {
  JOB_PROFILES_STORAGE_KEY,
  SELECTED_JOB_STORAGE_KEY,
  useJobProfiles,
  useSelectedJobProfileId,
} from "../hooks/use-job-profiles";
import {
  NOTIFICATIONS_STORAGE_KEY,
  useNotifications,
} from "../hooks/use-notifications";
import {
  type RetentionDays,
  usePrivacyAcknowledged,
  useRetentionDays,
} from "../hooks/use-workspace-settings";
import {
  createWorkspaceBackup,
  parseWorkspaceBackup,
  serializeWorkspaceBackup,
  WORKSPACE_PREFERENCE_KEYS,
} from "../utils/workspace-backup";
import { Icons } from "./icons";
import { PageHeader } from "./ui";

export function SettingsPage() {
  const [candidates, setCandidates, candidatesHydrated] = useCandidates();
  const [jobProfiles] = useJobProfiles();
  const [selectedJobId] = useSelectedJobProfileId();
  const [notifications] = useNotifications();
  const [privacyAcknowledged, setPrivacyAcknowledged] =
    usePrivacyAcknowledged();
  const [retentionDays, setRetentionDays] = useRetentionDays();
  const [message, setMessage] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const storageBytes = candidatesHydrated ? getWorkspaceStorageBytes() : 0;

  function exportWorkspace() {
    const preferences = Object.fromEntries(
      WORKSPACE_PREFERENCE_KEYS.flatMap((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return [];

        try {
          return [[key, JSON.parse(raw)]];
        } catch {
          return [];
        }
      }),
    );
    const backup = createWorkspaceBackup({
      candidates,
      jobProfiles,
      selectedJobId,
      notifications,
      preferences,
    });
    const blob = new Blob([serializeWorkspaceBackup(backup)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `talentlens-workspace-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Workspace backup downloaded.");
  }

  async function importWorkspace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = parseWorkspaceBackup(await file.text());
      localStorage.setItem(
        CANDIDATES_STORAGE_KEY,
        JSON.stringify(backup.data.candidates),
      );
      localStorage.setItem(
        JOB_PROFILES_STORAGE_KEY,
        JSON.stringify(backup.data.jobProfiles),
      );
      localStorage.setItem(
        SELECTED_JOB_STORAGE_KEY,
        JSON.stringify(backup.data.selectedJobId),
      );
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(backup.data.notifications),
      );
      WORKSPACE_PREFERENCE_KEYS.forEach((key) => {
        if (Object.hasOwn(backup.data.preferences, key)) {
          localStorage.setItem(
            key,
            JSON.stringify(backup.data.preferences[key]),
          );
        }
      });
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The workspace backup could not be restored.",
      );
    }
  }

  function clearCandidates() {
    if (
      !window.confirm(
        "Delete all candidate profiles from this browser? Export a backup first if you may need them.",
      )
    ) {
      return;
    }
    setCandidates([]);
    setMessage("All candidate profiles were removed.");
  }

  function resetWorkspace() {
    if (
      !window.confirm(
        "Reset the entire local workspace? Candidates, job profiles, notifications, filters, and preferences will be deleted.",
      )
    ) {
      return;
    }

    Object.keys(localStorage)
      .filter((key) => key.startsWith("talentlens-"))
      .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Browser-local controls"
        title="Settings"
        description="Manage privacy, retention, and portable backups for this browser workspace."
      />

      <div className="settings-grid">
        <section className="card settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <Icons.download size={19} />
            </span>
            <div>
              <h2>Backup and restore</h2>
              <p>
                Export candidates, job profiles, notifications, and preferences
                as a versioned JSON file.
              </p>
            </div>
          </div>
          <div className="settings-actions">
            <button className="button primary" onClick={exportWorkspace}>
              <Icons.download size={17} /> Export workspace
            </button>
            <button
              className="button secondary"
              onClick={() => importRef.current?.click()}
            >
              <Icons.upload size={17} /> Restore backup
            </button>
            <input
              ref={importRef}
              className="visually-hidden"
              type="file"
              accept=".json,application/json"
              onChange={importWorkspace}
            />
          </div>
          <p className="settings-note">
            Restoring replaces the current workspace after validating the
            backup structure. Existing data is not merged.
          </p>
        </section>

        <section className="card settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <Icons.file size={19} />
            </span>
            <div>
              <h2>Local storage</h2>
              <p>
                {formatBytes(storageBytes)} used by TalentLens in this browser.
              </p>
            </div>
          </div>
          <dl className="settings-facts">
            <div>
              <dt>Candidate profiles</dt>
              <dd>{candidates.length}</dd>
            </div>
            <div>
              <dt>Job profiles</dt>
              <dd>{jobProfiles.length}</dd>
            </div>
            <div>
              <dt>Raw CV files</dt>
              <dd>Not persisted</dd>
            </div>
          </dl>
          <button className="text-button danger-link" onClick={clearCandidates}>
            Delete candidate profiles
          </button>
        </section>

        <section className="card settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <Icons.check size={19} />
            </span>
            <div>
              <h2>Privacy and retention</h2>
              <p>
                Analysis runs in this browser. Extracted profile data remains
                until you delete it or a retention limit expires.
              </p>
            </div>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={privacyAcknowledged}
              onChange={(event) =>
                setPrivacyAcknowledged(event.target.checked)
              }
            />
            <span>
              <strong>Allow local CV analysis</strong>
              <small>
                Required before Analyze is enabled on the upload page.
              </small>
            </span>
          </label>
          <label className="settings-field">
            <span>Automatically remove analyzed candidates after</span>
            <select
              value={retentionDays}
              onChange={(event) =>
                setRetentionDays(Number(event.target.value) as RetentionDays)
              }
            >
              <option value={0}>Never</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
            <small>
              This applies to uploaded CV profiles. Built-in demonstration
              candidates are retained until the workspace is reset.
            </small>
          </label>
        </section>

        <section className="card settings-card danger-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <Icons.close size={19} />
            </span>
            <div>
              <h2>Reset workspace</h2>
              <p>
                Remove every TalentLens localStorage entry and return to the
                built-in demonstration state.
              </p>
            </div>
          </div>
          <button className="button danger-button" onClick={resetWorkspace}>
            Reset local workspace
          </button>
        </section>
      </div>

      {message && (
        <p className="settings-message" role="status">
          {message}
        </p>
      )}
    </>
  );
}

function getWorkspaceStorageBytes() {
  if (typeof window === "undefined") return 0;

  return Object.keys(localStorage)
    .filter((key) => key.startsWith("talentlens-"))
    .reduce(
      (total, key) =>
        total + new Blob([key, localStorage.getItem(key) ?? ""]).size,
      0,
    );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
