"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function Modal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        <div className="body">{children}</div>
        <div className="actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: grid;
          place-items: center;
          z-index: 100;
          padding: 1rem;
        }
        .dialog {
          width: min(420px, 100%);
          background: var(--bg-elevated);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow);
          padding: 1.25rem 1.25rem 1.1rem;
        }
        h2 {
          margin: 0;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
        }
        .body {
          margin: 0.75rem 0 1.15rem;
          color: var(--text-muted);
          font-size: 0.92rem;
          line-height: 1.45;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.55rem;
        }
      `}</style>
    </div>
  );
}
