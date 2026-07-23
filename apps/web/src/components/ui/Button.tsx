"use client";

import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={cn("btn", `btn-${variant}`, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Please wait…" : children}
      <style jsx>{`
        .btn {
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 0.55rem 1rem;
          cursor: pointer;
          font-weight: 600;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .btn:not(:disabled):hover {
          transform: translateY(-1px);
        }
        .btn-primary {
          background: var(--accent);
          color: white;
        }
        .btn-secondary {
          background: var(--bg-muted);
          color: var(--text);
          border-color: var(--border);
        }
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        .btn-ghost {
          background: transparent;
          color: var(--text);
        }
      `}</style>
    </button>
  );
}
