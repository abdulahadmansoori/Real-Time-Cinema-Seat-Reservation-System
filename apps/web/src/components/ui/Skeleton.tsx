"use client";

import { cn } from "@/lib/cn";

export function Skeleton({
  className,
  height,
  width,
  rounded = 8,
}: {
  className?: string;
  height?: number | string;
  width?: number | string;
  rounded?: number;
}) {
  return (
    <span
      className={cn("sk", className)}
      style={{
        height,
        width: width ?? "100%",
        borderRadius: rounded,
      }}
    >
      <style jsx>{`
        .sk {
          display: block;
          background: linear-gradient(
            90deg,
            var(--bg-muted) 0%,
            color-mix(in srgb, var(--bg-elevated) 70%, var(--bg-muted)) 50%,
            var(--bg-muted) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </span>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="table-sk">
      <div className="filters">
        <Skeleton height={36} width={140} />
        <Skeleton height={36} width={140} />
        <Skeleton height={36} width={160} />
        <Skeleton height={36} width={90} />
      </div>
      <div className="head">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={14} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div className="row" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={18} />
          ))}
        </div>
      ))}
      <div className="pager">
        <Skeleton height={32} width={80} />
        <Skeleton height={16} width={140} />
        <Skeleton height={32} width={80} />
      </div>
      <style jsx>{`
        .table-sk {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .filters,
        .head,
        .row,
        .pager {
          display: grid;
          gap: 0.75rem;
        }
        .filters {
          grid-template-columns: repeat(auto-fit, minmax(120px, 160px));
          margin-bottom: 0.5rem;
        }
        .head,
        .row {
          grid-template-columns: repeat(${cols}, 1fr);
          align-items: center;
          padding: 0.45rem 0;
        }
        .row {
          border-bottom: 1px solid var(--border);
          padding: 0.7rem 0;
        }
        .pager {
          grid-template-columns: auto 1fr auto;
          align-items: center;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-sk">
      <Skeleton height={28} width={220} />
      <Skeleton height={16} width={280} />
      <div className="card">
        <TableSkeleton />
      </div>
      <style jsx>{`
        .page-sk {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem 2rem;
          min-height: calc(100vh - 72px);
        }
        .card {
          flex: 1;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export function SeatGridSkeleton() {
  return (
    <div className="grid-sk">
      <Skeleton height={28} width={180} rounded={8} />
      <div className="legend">
        <Skeleton height={14} width={80} />
        <Skeleton height={14} width={80} />
        <Skeleton height={14} width={80} />
      </div>
      <div className="rows">
        {Array.from({ length: 5 }).map((_, r) => (
          <div className="row" key={r}>
            {Array.from({ length: 10 }).map((_, c) => (
              <Skeleton key={c} height={42} width={48} rounded={8} />
            ))}
          </div>
        ))}
      </div>
      <Skeleton height={40} width={140} rounded={10} />
      <style jsx>{`
        .grid-sk {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0 1rem;
        }
        .legend,
        .row {
          display: flex;
          gap: 0.45rem;
        }
        .legend {
          gap: 1rem;
          margin-bottom: 0.25rem;
        }
        .rows {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
      `}</style>
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="metrics">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="item" key={i}>
          <Skeleton height={118} rounded={16} />
        </div>
      ))}
      <style jsx>{`
        .metrics {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.85rem;
        }
        @media (max-width: 1200px) {
          .metrics {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .metrics {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
