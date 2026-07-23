"use client";

import type { PageMeta } from "@cinema/shared";

export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  return (
    <div className="pager">
      <button
        disabled={!meta.hasPrev}
        onClick={() => onPageChange(meta.page - 1)}
      >
        Prev
      </button>
      <span>
        Page {meta.page} of {meta.totalPages} ({meta.total} total)
      </span>
      <button
        disabled={!meta.hasNext}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Next
      </button>
      {onPageSizeChange ? (
        <select
          value={meta.pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/page
            </option>
          ))}
        </select>
      ) : null}
      <style jsx>{`
        .pager {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-top: 1rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        button,
        select {
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          border-radius: 8px;
          padding: 0.35rem 0.65rem;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
