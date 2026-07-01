import type { JobProfile } from "../../data/job-profiles";

export function JobProfileList({
  profiles,
  selectedProfileId,
  onProfileSelect,
  onRestoreDefaults,
}: {
  profiles: JobProfile[];
  selectedProfileId?: string;
  onProfileSelect: (profileId: string) => void;
  onRestoreDefaults: () => void;
}) {
  return (
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
            className={selectedProfileId === profile.id ? "active" : ""}
            onClick={() => onProfileSelect(profile.id)}
          >
            <strong>{profile.name}</strong>
            <small>
              {profile.requiredSkills.length} required skills -{" "}
              {profile.minimumExperienceYears}+ years
            </small>
          </button>
        ))}
      </div>
      <button className="text-button" onClick={onRestoreDefaults}>
        Restore defaults
      </button>
    </aside>
  );
}
