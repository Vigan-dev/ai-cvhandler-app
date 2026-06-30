import Link from "next/link";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Icons } from "../icons";
import type { AnalysisResult, UploadFile } from "./types";

export function UploadMainCard({
  files,
  dragging,
  setDragging,
  inputRef,
  queueMessage,
  analysisResult,
  analyzing,
  queuedCount,
  completeCount,
  canAnalyze,
  onAddFiles,
  onClearFiles,
  onRemoveFile,
  onAnalyzeFiles,
}: {
  files: UploadFile[];
  dragging: boolean;
  setDragging: Dispatch<SetStateAction<boolean>>;
  inputRef: RefObject<HTMLInputElement | null>;
  queueMessage: string;
  analysisResult: AnalysisResult | null;
  analyzing: boolean;
  queuedCount: number;
  completeCount: number;
  canAnalyze: boolean;
  onAddFiles: (files: FileList | null) => void;
  onClearFiles: () => void;
  onRemoveFile: (id: number) => void;
  onAnalyzeFiles: () => void;
}) {
  return (
    <section className="card upload-main-card">
      <div
        className={`dropzone ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          onAddFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={(event) => onAddFiles(event.target.files)}
          className="sr-only"
        />
        <div className="dropzone-icon">
          <Icons.upload size={27} />
        </div>
        <h2>{dragging ? "Drop files to add them" : "Drag and drop CVs here"}</h2>
        <p>
          or{" "}
          <button onClick={() => inputRef.current?.click()}>
            browse your files
          </button>
        </p>
        <small>PDF, DOCX, or TXT · Up to 10 MB each · Maximum 20 files</small>
      </div>

      <UploadQueue
        files={files}
        completeCount={completeCount}
        queueMessage={queueMessage}
        analysisResult={analysisResult}
        analyzing={analyzing}
        onClearFiles={onClearFiles}
        onRemoveFile={onRemoveFile}
      />

      <div className="upload-footer">
        <span>
          <Icons.lock size={16} /> Raw files are processed in memory; only
          candidate metadata is saved locally.
        </span>
        <button
          className="button primary"
          onClick={onAnalyzeFiles}
          disabled={!canAnalyze}
        >
          {analyzing
            ? "Analyzing locally..."
            : `Analyze ${queuedCount} CV${queuedCount === 1 ? "" : "s"}`}
          <Icons.arrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

function UploadQueue({
  files,
  completeCount,
  queueMessage,
  analysisResult,
  analyzing,
  onClearFiles,
  onRemoveFile,
}: {
  files: UploadFile[];
  completeCount: number;
  queueMessage: string;
  analysisResult: AnalysisResult | null;
  analyzing: boolean;
  onClearFiles: () => void;
  onRemoveFile: (id: number) => void;
}) {
  return (
    <>
      <div className="upload-list-header">
        <div>
          <h2>Analysis queue</h2>
          <p>
            {files.length} files · {completeCount} analyzed
          </p>
        </div>
        {files.length > 0 && (
          <button
            className="text-button"
            onClick={onClearFiles}
            disabled={analyzing}
          >
            Clear all
          </button>
        )}
      </div>

      {queueMessage && (
        <p className="queue-message" role="status">
          {queueMessage}
        </p>
      )}

      <div className="upload-list" aria-live="polite">
        {files.length === 0 ? (
          <div className="empty-state compact">
            <span>
              <Icons.file size={24} />
            </span>
            <h3>No files in the queue</h3>
            <p>Selected CVs remain in memory until this page is closed.</p>
          </div>
        ) : (
          files.map((file) => (
            <UploadRow
              key={file.id}
              file={file}
              analyzing={analyzing}
              onRemoveFile={onRemoveFile}
            />
          ))
        )}
      </div>

      {analysisResult && (
        <div
          className={`analysis-result ${analysisResult.failed ? "has-errors" : ""}`}
          role="status"
        >
          <span>
            <strong>
              {analysisResult.completed} CV
              {analysisResult.completed === 1 ? "" : "s"} analyzed
            </strong>
            {analysisResult.failed > 0 && (
              <small>
                {analysisResult.failed} file
                {analysisResult.failed === 1 ? "" : "s"} need attention
              </small>
            )}
          </span>
          {analysisResult.completed > 0 && (
            <Link href="/candidates" className="button secondary">
              View candidates <Icons.arrowRight size={16} />
            </Link>
          )}
        </div>
      )}
    </>
  );
}

function UploadRow({
  file,
  analyzing,
  onRemoveFile,
}: {
  file: UploadFile;
  analyzing: boolean;
  onRemoveFile: (id: number) => void;
}) {
  return (
    <div className={`upload-row upload-${file.status}`}>
      <div className="upload-file-icon">
        <Icons.file size={20} />
      </div>
      <div className="upload-file-copy">
        <div className="upload-file-top">
          <strong>{file.name}</strong>
          <span>{file.size}</span>
        </div>
        {file.status === "error" ? (
          <p className="error-text">
            <Icons.close size={13} /> {file.error}
          </p>
        ) : (
          <div className="progress-row">
            <div className="progress-track">
              <span style={{ width: `${file.progress}%` }} />
            </div>
            <small>{getStatusLabel(file)}</small>
          </div>
        )}
      </div>
      <div className={`upload-status-icon ${file.status}`}>
        {file.status === "complete" ? (
          <Icons.check size={16} />
        ) : file.status === "error" ? (
          <Icons.close size={16} />
        ) : file.status === "queued" ? (
          <span className="queued-dot" />
        ) : (
          <span className="spinner" />
        )}
      </div>
      <button
        className="ghost-icon"
        aria-label={`Remove ${file.name}`}
        disabled={analyzing}
        onClick={() => onRemoveFile(file.id)}
      >
        <Icons.close size={17} />
      </button>
    </div>
  );
}

function getStatusLabel(file: UploadFile) {
  if (file.status === "queued") return "Ready";
  if (file.status === "extracting") return "Reading CV";
  if (file.status === "analyzing") return "Scoring";
  return "Analyzed";
}
