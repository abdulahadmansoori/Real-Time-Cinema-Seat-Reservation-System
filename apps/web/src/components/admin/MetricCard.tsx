"use client";

const tones = {
  peach: "var(--peach)",
  mint: "var(--mint)",
  sky: "var(--sky)",
  amber: "var(--warning-soft)",
  lavender: "var(--lavender)",
  info: "var(--sky)",
  success: "var(--mint)",
  warning: "var(--peach)",
  danger: "var(--danger-soft)",
} as const;

export function MetricCard({
  label,
  value,
  tone = "sky",
  hint,
  delta,
  deltaUp,
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof tones;
  hint?: string;
  delta?: string;
  deltaUp?: boolean;
}) {
  return (
    <article className="metric" style={{ background: tones[tone] }}>
      <span className="label">{label}</span>
      <strong className="value">{value}</strong>
      {delta ? (
        <span className={`delta ${deltaUp === false ? "down" : "up"}`}>
          <span aria-hidden>{deltaUp === false ? "↓" : "↑"}</span> {delta}
        </span>
      ) : null}
      {hint ? <span className="hint">{hint}</span> : null}
      <style jsx>{`
        .metric {
          border-radius: 16px;
          padding: 1.15rem 1.2rem 1.05rem;
          min-height: 118px;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          border: 1px solid transparent;
        }
        .label {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .value {
          font-size: 1.65rem;
          letter-spacing: -0.03em;
          font-weight: 700;
          margin-top: 0.25rem;
          line-height: 1.15;
        }
        .delta {
          margin-top: 0.45rem;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }
        .delta.up {
          color: var(--success);
        }
        .delta.down {
          color: var(--danger);
        }
        .hint {
          margin-top: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </article>
  );
}
