import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { JobProfile } from "../../data/job-profiles";
import { Icons } from "../icons";

export function UploadSidebar({
  jobProfiles,
  selectedJob,
  setSelectedJobId,
  privacyAcknowledged,
  setPrivacyAcknowledged,
}: {
  jobProfiles: JobProfile[];
  selectedJob?: JobProfile;
  setSelectedJobId: Dispatch<SetStateAction<string>>;
  privacyAcknowledged: boolean;
  setPrivacyAcknowledged: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <aside className="upload-sidebar">
      <PrivacyCheckCard
        privacyAcknowledged={privacyAcknowledged}
        setPrivacyAcknowledged={setPrivacyAcknowledged}
      />
      <NextStepsCard />
      <JobContextCard
        jobProfiles={jobProfiles}
        selectedJob={selectedJob}
        setSelectedJobId={setSelectedJobId}
      />
    </aside>
  );
}

function PrivacyCheckCard({
  privacyAcknowledged,
  setPrivacyAcknowledged,
}: {
  privacyAcknowledged: boolean;
  setPrivacyAcknowledged: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <section className="card privacy-check-card">
      <div className="aside-icon violet">
        <Icons.check size={20} />
      </div>
      <h2>Local privacy check</h2>
      <p>
        Raw files stay in browser memory. Extracted candidate metadata, contact
        details, scores, and notes are saved in localStorage.
      </p>
      <label className="privacy-checkbox">
        <input
          type="checkbox"
          checked={privacyAcknowledged}
          onChange={(event) => setPrivacyAcknowledged(event.target.checked)}
        />
        <span>I understand this device stores the analyzed metadata.</span>
      </label>
      <Link className="text-link centered" href="/settings">
        Review privacy and backups
      </Link>
    </section>
  );
}

function NextStepsCard() {
  return (
    <section className="card">
      <div className="aside-icon violet">
        <Icons.sparkles size={20} />
      </div>
      <h2>What happens next?</h2>
      <ol className="steps-list">
        <li>
          <span>1</span>
          <div>
            <strong>Local text extraction</strong>
            <p>The browser reads PDF, DOCX, or TXT content in memory.</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Local matching</strong>
            <p>Skills, experience, and education are scored locally.</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Saved results</strong>
            <p>Only derived candidate metadata is stored locally.</p>
          </div>
        </li>
      </ol>
    </section>
  );
}

function JobContextCard({
  jobProfiles,
  selectedJob,
  setSelectedJobId,
}: {
  jobProfiles: JobProfile[];
  selectedJob?: JobProfile;
  setSelectedJobId: Dispatch<SetStateAction<string>>;
}) {
  return (
    <section className="card job-context-card">
      <div className="aside-icon blue">
        <Icons.briefcase size={20} />
      </div>
      <h2>Job context</h2>
      <p>CVs will be evaluated against:</p>
      <label className="job-selector">
        <span>
          <strong>{selectedJob?.name ?? "No job profile"}</strong>
          <small>Local matching profile</small>
        </span>
        <select
          value={selectedJob?.id ?? ""}
          onChange={(event) => setSelectedJobId(event.target.value)}
          aria-label="Job matching profile"
        >
          {jobProfiles.map((job) => (
            <option value={job.id} key={job.id}>
              {job.name}
            </option>
          ))}
        </select>
        <Icons.chevronDown size={16} />
      </label>
      <Link className="text-link centered" href="/jobs">
        Edit job profiles
      </Link>
    </section>
  );
}
