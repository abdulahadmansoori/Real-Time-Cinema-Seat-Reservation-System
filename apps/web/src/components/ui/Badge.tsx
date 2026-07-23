"use client";

import { cn } from "@/lib/cn";

const tones: Record<string, string> = {
  success: "var(--success-soft)",
  warning: "var(--warning-soft)",
  danger: "var(--danger-soft)",
  info: "var(--accent-soft)",
  muted: "var(--bg-muted)",
};

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={cn("badge")} style={{ background: tones[tone] }}>
      {children}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.15rem 0.55rem;
          font-size: 0.75rem;
          font-weight: 700;
        }
      `}</style>
    </span>
  );
}
