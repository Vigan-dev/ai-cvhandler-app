"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultJobProfiles, type JobProfile } from "../data/job-profiles";
import {
  createJobProfileId,
  useJobProfiles,
  useSelectedJobProfileId,
} from "../hooks/use-job-profiles";
import { ConfirmationDialog } from "./confirmation-dialog";
import { Icons } from "./icons";
import { JobProfileEditor } from "./job-profiles/JobProfileEditor";
import { JobProfileList } from "./job-profiles/JobProfileList";
import {
  buildProfileFromDraft,
  type JobDraft,
  parseJobProfileList,
  toJobDraft,
} from "./job-profiles/job-profile-draft";
import { PageHeader } from "./ui";

type JobProfileConfirmation =
  | { type: "delete-profile"; profileId: string; profileName: string }
  | { type: "restore-defaults" };

export function JobProfilesPage() {
  const [profiles, setProfiles] = useJobProfiles();
  const [selectedJobId, setSelectedJobId] = useSelectedJobProfileId();
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedJobId) ?? profiles[0];
  const [draft, setDraft] = useState<JobDraft>(() =>
    toJobDraft(selectedProfile ?? defaultJobProfiles[0]),
  );
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] =
    useState<JobProfileConfirmation | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled && selectedProfile) {
        setDraft(toJobDraft(selectedProfile));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedProfile]);

  const weightTotal = useMemo(
    () =>
      draft.skillsWeight +
      draft.experienceWeight +
      draft.educationWeight +
      draft.impactWeight,
    [draft],
  );
  const draftProfile = useMemo(
    () =>
      selectedProfile ? buildProfileFromDraft(selectedProfile, draft) : null,
    [draft, selectedProfile],
  );

  function updateDraft(changes: Partial<JobDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function saveProfile() {
    if (!selectedProfile) return;
    const name = draft.name.trim();
    const requiredSkills = parseJobProfileList(draft.requiredSkills);

    if (!name || requiredSkills.length === 0) {
      setMessage("A profile name and at least one required skill are required.");
      return;
    }

    const updated: JobProfile = {
      ...buildProfileFromDraft(selectedProfile, draft),
      requiredSkills,
      updatedAt: new Date().toISOString(),
    };

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === selectedProfile.id ? updated : profile,
      ),
    );
    setMessage(
      weightTotal === 100
        ? "Job profile saved."
        : "Job profile saved. Weights were normalized to 100%.",
    );
  }

  function createProfile() {
    const now = new Date().toISOString();
    const profile: JobProfile = {
      id: createJobProfileId(
        "New job profile",
        profiles.map((item) => item.id),
      ),
      name: "New job profile",
      description: "Describe the role and the evidence a strong CV should show.",
      requiredSkills: ["Required skill"],
      optionalSkills: [],
      requiredSkillStrictness: "balanced",
      skillAliases: {},
      minimumExperienceYears: 3,
      educationKeywords: [],
      weights: { skills: 50, experience: 30, education: 10, impact: 10 },
      createdAt: now,
      updatedAt: now,
    };
    setProfiles((current) => [...current, profile]);
    setSelectedJobId(profile.id);
    setMessage("New profile created. Edit and save its requirements.");
  }

  function duplicateProfile() {
    if (!selectedProfile) return;
    const now = new Date().toISOString();
    const profile: JobProfile = {
      ...selectedProfile,
      id: createJobProfileId(
        `${selectedProfile.name} copy`,
        profiles.map((item) => item.id),
      ),
      name: `${selectedProfile.name} copy`,
      createdAt: now,
      updatedAt: now,
    };
    setProfiles((current) => [...current, profile]);
    setSelectedJobId(profile.id);
    setMessage("Profile duplicated.");
  }

  function removeProfile() {
    if (!selectedProfile || profiles.length === 1) {
      setMessage("At least one job profile must remain.");
      return;
    }
    setConfirmation({
      type: "delete-profile",
      profileId: selectedProfile.id,
      profileName: selectedProfile.name,
    });
  }

  function restoreDefaults() {
    setConfirmation({ type: "restore-defaults" });
  }

  function confirmJobProfileAction() {
    if (!confirmation) return;

    if (confirmation.type === "delete-profile") {
      const remaining = profiles.filter(
        (profile) => profile.id !== confirmation.profileId,
      );

      setConfirmation(null);
      if (remaining.length === profiles.length) {
        setMessage("Profile could not be found.");
        return;
      }
      if (remaining.length === 0) {
        setMessage("At least one job profile must remain.");
        return;
      }

      setProfiles(remaining);
      setSelectedJobId(remaining[0].id);
      setMessage("Profile removed.");
      return;
    }

    setConfirmation(null);
    setProfiles(defaultJobProfiles);
    setSelectedJobId(defaultJobProfiles[0].id);
    setMessage("Default job profiles restored.");
  }

  return (
    <>
      <PageHeader
        eyebrow="Local matching configuration"
        title="Job profiles"
        description="Define the evidence, experience, education, and score weights used for local CV matching."
        actions={
          <>
            <button className="button secondary" onClick={duplicateProfile}>
              Duplicate
            </button>
            <button className="button primary" onClick={createProfile}>
              <Icons.plus size={17} /> New profile
            </button>
          </>
        }
      />

      <div className="job-profile-layout">
        <JobProfileList
          profiles={profiles}
          selectedProfileId={selectedProfile?.id}
          onProfileSelect={setSelectedJobId}
          onRestoreDefaults={restoreDefaults}
        />

        {selectedProfile && (
          <JobProfileEditor
            draft={draft}
            draftProfile={draftProfile}
            weightTotal={weightTotal}
            message={message}
            onDraftChange={updateDraft}
            onSave={saveProfile}
            onRemove={removeProfile}
          />
        )}
      </div>

      <ConfirmationDialog
        open={confirmation !== null}
        tone="danger"
        title={
          confirmation?.type === "restore-defaults"
            ? "Restore default profiles?"
            : "Delete job profile?"
        }
        description={
          confirmation?.type === "restore-defaults"
            ? "All custom job profiles will be replaced with the built-in defaults."
            : `Delete ${confirmation?.profileName ?? "this profile"}? Candidates already analyzed will remain, but this matching configuration will be removed.`
        }
        confirmLabel={
          confirmation?.type === "restore-defaults"
            ? "Restore defaults"
            : "Delete profile"
        }
        onConfirm={confirmJobProfileAction}
        onCancel={() => setConfirmation(null)}
      />
    </>
  );
}
