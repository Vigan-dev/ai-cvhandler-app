export const LOCAL_STORAGE_PREFIX = "talentlens-";

const LARGE_WRITE_BYTES = 100 * 1024;
const SOFT_WORKSPACE_LIMIT_BYTES = 4.5 * 1024 * 1024;

export type StorageRecoveryDetail = {
  message: string;
  steps: string[];
};

export class WorkspaceStorageError extends Error {
  detail: StorageRecoveryDetail;

  constructor(message: string, steps = getStorageRecoverySteps()) {
    super(message);
    this.name = "WorkspaceStorageError";
    this.detail = { message, steps };
  }
}

export function assertStorageWriteFits(key: string, serializedValue: string) {
  if (byteSize(serializedValue) < LARGE_WRITE_BYTES) return;

  assertStorageBatchFits([[key, serializedValue]]);
}

export function assertStorageBatchFits(entries: Array<[string, string]>) {
  if (typeof window === "undefined") return;

  const replacementKeys = new Set(entries.map(([key]) => key));
  const retainedBytes = Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith(LOCAL_STORAGE_PREFIX) && !replacementKeys.has(key),
    )
    .reduce(
      (total, key) =>
        total + byteSize(key) + byteSize(localStorage.getItem(key) ?? ""),
      0,
    );
  const incomingBytes = entries.reduce(
    (total, [key, value]) => total + byteSize(key) + byteSize(value),
    0,
  );
  const projectedBytes = retainedBytes + incomingBytes;

  if (projectedBytes > SOFT_WORKSPACE_LIMIT_BYTES) {
    throw new WorkspaceStorageError(
      `This change needs ${formatBytes(projectedBytes)} of browser storage, which is close to the local workspace limit.`,
    );
  }
}

export function getWorkspaceStorageBytes() {
  if (typeof window === "undefined") return 0;

  return Object.keys(localStorage)
    .filter((key) => key.startsWith(LOCAL_STORAGE_PREFIX))
    .reduce(
      (total, key) =>
        total + byteSize(key) + byteSize(localStorage.getItem(key) ?? ""),
      0,
    );
}

export function getStorageRecoveryDetail(error?: unknown): StorageRecoveryDetail {
  if (error instanceof WorkspaceStorageError) return error.detail;

  return {
    message:
      "Local changes could not be saved because browser storage is unavailable or full.",
    steps: getStorageRecoverySteps(),
  };
}

export function getStorageRecoverySteps() {
  return [
    "Export a workspace backup from Settings before deleting data.",
    "Delete older candidate profiles or shorten the retention window.",
    "Free browser storage for this site, then retry the action.",
  ];
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function byteSize(value: string) {
  return new Blob([value]).size;
}
