"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icons } from "./icons";

type ConfirmationTone = "default" | "danger";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmationTone;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    cancelButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="confirmation-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className={`confirmation-dialog confirmation-dialog-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
      >
        <div className="confirmation-dialog-heading">
          <span className="confirmation-dialog-icon" aria-hidden="true">
            {tone === "danger" ? (
              <Icons.close size={18} />
            ) : (
              <Icons.check size={18} />
            )}
          </span>
          <div>
            <h2 id="confirmation-dialog-title">{title}</h2>
            <p id="confirmation-dialog-description">{description}</p>
          </div>
        </div>

        <div className="confirmation-dialog-actions">
          <button
            ref={cancelButtonRef}
            className="button secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={tone === "danger" ? "button danger-button" : "button primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
