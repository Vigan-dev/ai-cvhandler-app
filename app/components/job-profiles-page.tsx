"use client";

import { useEffect, useMemo, useState } from "react";
import {
  defaultJobProfiles,
  type JobProfile,
} from "../data/job-profiles";
import {
  createJobProfileId,
  normalizeWeights,
  useJobProfiles,
  useSelectedJobProfileId,
} from "../hooks/use-job-profiles";
import { Icons } from "./icons";
import { PageHeader } from "./ui";

type JobDraft = {
  name: string;
  description: string;
  requiredSkills: string;
  optionalSkills: string;
  minimumExperienceYears: number;
  educationKeywords: string;
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
  impactWeight: number;
};

export function JobProfilesPage() {
  const [profiles, setProfiles] = useJobProfiles();
  const [selectedJobId, setSelectedJobId] = useSelectedJobProfileId();
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedJobId) ?? profiles[0];
  const [draft, setDraft] = useState<JobDraft>(() =>
    toDraft(selectedProfile ?? defaultJobProfiles[0]),
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled && selectedProfile) {
        setDraft(toDraft(selectedProfile));
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

  function saveProfile() {
    if (!selectedProfile) return;
    const name = draft.name.trim();
    const requiredSkills = parseList(draft.requiredSkills);

    if (!name || requiredSkills.length === 0) {
      setMessage("A profile name and at least one required skill are required.");
      return;
    }

    const weights = normalizeWeights({
      skills: draft.skillsWeight,
      experience: draft.experienceWeight,
      education: draft.educationWeight,
      impact: draft.impactWeight,
    });
    const updated: JobProfile = {
      ...selectedProfile,
      name,
      description: draft.description.trim(),
      requiredSkills,
      optionalSkills: parseList(draft.optionalSkills),
      minimumExperienceYears: Math.max(
        0,
        Math.round(draft.minimumExperienceYears),
      ),
      educationKeywords: parseList(draft.educationKeywords),
      weights,
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
    if (!window.confirm(`Delete ${selectedProfile.name}?`)) return;

    const remaining = profiles.filter(
      (profile) => profile.id !== selectedProfile.id,
    );
    setProfiles(remaining);
    setSelectedJobId(remaining[0].id);
    setMessage("Profile removed.");
  }

  function restoreDefaults() {
    if (!window.confirm("Replace all job profiles with the default profiles?")) {
      return;
    }
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
        <aside className="card job-profile-list">
          <div className="section-header">
            <div>
              <h2>Profiles</h2>
              <p>{profiles.length} local matching configurations</p>
            </div>
          </div>
          <div>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={selectedProfile?.id === profile.id ? "active" : ""}
                onClick={() => setSelectedJobId(profile.id)}
              >
                <strong>{profile.name}</strong>
                <small>
                  {profile.requiredSkills.length} required skills ·{" "}
                  {profile.minimumExperienceYears}+ years
                </small>
              </button>
            ))}
          </div>
          <button className="text-button" onClick={restoreDefaults}>
            Restore defaults
          </button>
        </aside>

        {selectedProfile && (
          <section className="card job-profile-editor">
            <div className="form-grid">
              <label className="full">
                <span>Profile name</span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  maxLength={100}
                />
              </label>
              <label className="full">
                <span>Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  maxLength={600}
                />
              </label>
              <label className="full">
                <span>Required skills</span>
                <textarea
                  value={draft.requiredSkills}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      requiredSkills: event.target.value,
                    }))
                  }
                  placeholder="React, TypeScript, Accessibility"
                />
                <small>Separate skills with commas or new lines.</small>
              </label>
              <label className="full">
                <span>Optional skills</span>
                <textarea
                  value={draft.optionalSkills}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      optionalSkills: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Minimum experience</span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={draft.minimumExperienceYears}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      minimumExperienceYears: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Education keywords</span>
                <input
                  value={draft.educationKeywords}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      educationKeywords: event.target.value,
                    }))
                  }
                  placeholder="Computer science, software engineering"
                />
              </label>
            </div>

            <div className="weight-editor">
              <div className="section-header">
                <div>
                  <h2>Score weights</h2>
                  <p>
                    Current total: {weightTotal}%. Values are normalized when
                    saved.
                  </p>
                </div>
              </div>
              {(
                [
                  ["skillsWeight", "Skills"],
                  ["experienceWeight", "Experience"],
                  ["educationWeight", "Education"],
                  ["impactWeight", "Measured impact"],
                ] as const
              ).map(([field, label]) => (
                <label key={field}>
                  <span>
                    {label} <strong>{draft[field]}%</strong>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={draft[field]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
            <div className="editor-actions">
              <button className="text-button danger-link" onClick={removeProfile}>
                Delete profile
              </button>
              <button className="button primary" onClick={saveProfile}>
                Save profile
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function toDraft(profile: JobProfile): JobDraft {
  return {
    name: profile.name,
    description: profile.description,
    requiredSkills: profile.requiredSkills.join(", "),
    optionalSkills: profile.optionalSkills.join(", "),
    minimumExperienceYears: profile.minimumExperienceYears,
    educationKeywords: profile.educationKeywords.join(", "),
    skillsWeight: Math.round(profile.weights.skills),
    experienceWeight: Math.round(profile.weights.experience),
    educationWeight: Math.round(profile.weights.education),
    impactWeight: Math.round(profile.weights.impact),
  };
}

function parseList(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}
