"use client";

import {
  useJobProfiles,
  useSelectedJobProfileId,
} from "../hooks/use-job-profiles";
import { useUploadQueue } from "../hooks/use-upload-queue";
import { usePrivacyAcknowledged } from "../hooks/use-workspace-settings";
import { UploadMainCard } from "./upload/UploadMainCard";
import { UploadSidebar } from "./upload/UploadSidebar";
import { PageHeader } from "./ui";

export function UploadPage() {
  const [jobProfiles] = useJobProfiles();
  const [selectedJobId, setSelectedJobId] = useSelectedJobProfileId();
  const [privacyAcknowledged, setPrivacyAcknowledged] =
    usePrivacyAcknowledged();
  const selectedJob =
    jobProfiles.find((profile) => profile.id === selectedJobId) ??
    jobProfiles[0];
  const upload = useUploadQueue({ selectedJob, privacyAcknowledged });

  return (
    <>
      <PageHeader
        eyebrow="Local screening"
        title="Upload candidate CVs"
        description="Read and evaluate CVs locally in your browser, then save the analyzed candidate data."
      />

      <div className="upload-layout">
        <UploadMainCard
          files={upload.files}
          dragging={upload.dragging}
          setDragging={upload.setDragging}
          inputRef={upload.inputRef}
          queueMessage={upload.queueMessage}
          analysisResult={upload.analysisResult}
          analyzing={upload.analyzing}
          queuedCount={upload.queuedCount}
          completeCount={upload.completeCount}
          canAnalyze={upload.canAnalyze}
          onAddFiles={upload.addFiles}
          onClearFiles={upload.clearFiles}
          onRemoveFile={upload.removeFile}
          onManualTextChange={upload.updateManualText}
          onQueueManualText={upload.queueManualText}
          onAnalyzeFiles={upload.analyzeFiles}
        />

        <UploadSidebar
          jobProfiles={jobProfiles}
          selectedJob={selectedJob}
          setSelectedJobId={setSelectedJobId}
          privacyAcknowledged={privacyAcknowledged}
          setPrivacyAcknowledged={setPrivacyAcknowledged}
        />
      </div>
    </>
  );
}
