"use client";

import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  title,
  subtitle,
  fill = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  /** Stretch card to fill remaining viewport under the page header */
  fill?: boolean;
}) {
  return (
    <section className={cn("card", fill && "fill", className)}>
      {(title || subtitle) && (
        <header className="head">
          {title ? <h2>{title}</h2> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      )}
      <div className="body">{children}</div>
      <style jsx>{`
        .card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 1rem 1.1rem;
          display: flex;
          flex-direction: column;
        }
        .card.fill {
          min-height: calc(100vh - 180px);
        }
        .head h2 {
          margin: 0;
          font-size: 1.05rem;
        }
        .head p {
          margin: 0.25rem 0 0.85rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .body {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
      `}</style>
    </section>
  );
}
