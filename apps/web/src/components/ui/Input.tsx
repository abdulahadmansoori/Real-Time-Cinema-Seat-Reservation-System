"use client";

import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...rest }: Props) {
  const inputId = id ?? rest.name;
  return (
    <label className="field">
      {label ? <span className="label">{label}</span> : null}
      <input id={inputId} className={cn("input", className)} {...rest} />
      {error ? <span className="error">{error}</span> : null}
      <style jsx>{`
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          width: 100%;
        }
        .label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .input {
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          border-radius: 10px;
          padding: 0.65rem 0.8rem;
        }
        .error {
          color: var(--danger);
          font-size: 0.8rem;
        }
      `}</style>
    </label>
  );
}
