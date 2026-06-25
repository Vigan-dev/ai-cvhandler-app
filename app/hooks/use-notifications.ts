"use client";

import { usePersistentState } from "./use-persistent-state";

export type WorkspaceNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  read: boolean;
  createdAt: string;
};

const initialNotifications: WorkspaceNotification[] = [
  {
    id: "candidate-1",
    title: "Maya Chen is ready for review",
    detail: "Local score 94",
    href: "/candidates/1",
    read: false,
    createdAt: "2026-06-24T10:48:00.000Z",
  },
  {
    id: "workspace-local",
    title: "Browser-local workspace is active",
    detail: "Raw CV files are not persisted",
    href: "/upload",
    read: true,
    createdAt: "2026-06-24T08:00:00.000Z",
  },
];

export function useNotifications() {
  return usePersistentState<WorkspaceNotification[]>(
    "talentlens-notifications",
    initialNotifications,
    { validate: isNotificationArray },
  );
}

function isNotificationArray(
  value: unknown,
): value is WorkspaceNotification[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.detail === "string" &&
        typeof item.href === "string" &&
        item.href.startsWith("/") &&
        typeof item.read === "boolean" &&
        typeof item.createdAt === "string",
    )
  );
}
