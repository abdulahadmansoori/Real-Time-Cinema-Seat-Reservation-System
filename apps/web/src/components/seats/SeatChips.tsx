"use client";

function SeatIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 10h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z" />
      <path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      <path d="M8 19v2M16 19v2" />
    </svg>
  );
}

export function SeatChips({
  labels,
  empty = "—",
}: {
  labels: string[];
  empty?: string;
}) {
  if (!labels.length) return <span className="empty">{empty}</span>;

  return (
    <span className="wrap">
      {labels.map((label) => (
        <span key={label} className="chip" title={`Seat ${label}`}>
          <SeatIcon />
          {label}
        </span>
      ))}
      <style jsx>{`
        .wrap {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
          border-radius: 999px;
          padding: 0.2rem 0.55rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .empty {
          color: var(--text-muted);
        }
      `}</style>
    </span>
  );
}
