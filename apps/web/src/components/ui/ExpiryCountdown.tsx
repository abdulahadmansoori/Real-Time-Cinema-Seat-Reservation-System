"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return "Expired";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ExpiryCountdown({
  expiresAt,
  active,
}: {
  expiresAt: string;
  active: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return <span className="muted">—</span>;

  const remaining = new Date(expiresAt).getTime() - now;
  const urgent = remaining > 0 && remaining < 60_000;

  return (
    <span className={urgent ? "urgent" : "ok"} title={new Date(expiresAt).toLocaleString()}>
      {formatRemaining(remaining)}
      <style jsx>{`
        .ok {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .urgent {
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          color: var(--danger);
        }
        .muted {
          color: var(--text-muted);
        }
      `}</style>
    </span>
  );
}
