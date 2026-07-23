"use client";

import type { SeatDto } from "@cinema/shared";
import { cn } from "@/lib/cn";

export function SeatCell({
  seat,
  selected,
  onToggle,
}: {
  seat: SeatDto;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const reserved = seat.status === "RESERVED";
  return (
    <button
      type="button"
      className={cn(
        "seat",
        reserved && "reserved",
        selected && "selected",
      )}
      disabled={reserved}
      onClick={() => onToggle(seat.id)}
      title={seat.label}
    >
      {seat.label}
      <style jsx>{`
        .seat {
          width: 48px;
          height: 42px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--seat-available);
          color: var(--text);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.12s ease, background 0.12s ease;
        }
        .seat:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .seat.selected {
          background: var(--seat-selected);
          color: white;
          border-color: transparent;
        }
        .seat.reserved {
          background: var(--seat-reserved);
          color: #fff;
          cursor: not-allowed;
          opacity: 0.75;
        }
      `}</style>
    </button>
  );
}

export function SeatLegend() {
  return (
    <div className="legend">
      <span>
        <i className="a" /> Available
      </span>
      <span>
        <i className="s" /> Selected
      </span>
      <span>
        <i className="r" /> Reserved
      </span>
      <style jsx>{`
        .legend {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        i {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 4px;
          margin-right: 0.35rem;
          vertical-align: middle;
        }
        .a {
          background: var(--seat-available);
        }
        .s {
          background: var(--seat-selected);
        }
        .r {
          background: var(--seat-reserved);
        }
      `}</style>
    </div>
  );
}

export function SeatGrid({
  seats,
  selected,
  onToggle,
}: {
  seats: SeatDto[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const rows = ["A", "B", "C", "D", "E"];
  return (
    <div className="grid-wrap">
      <div className="screen">SCREEN</div>
      {rows.map((row) => (
        <div key={row} className="row">
          <span className="row-label">{row}</span>
          {seats
            .filter((s) => s.label.startsWith(row))
            .map((seat) => (
              <SeatCell
                key={seat.id}
                seat={seat}
                selected={selected.has(seat.id)}
                onToggle={onToggle}
              />
            ))}
        </div>
      ))}
      <style jsx>{`
        .grid-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          align-items: center;
        }
        .screen {
          width: min(100%, 520px);
          text-align: center;
          padding: 0.45rem;
          margin-bottom: 0.75rem;
          border-radius: 8px;
          background: linear-gradient(
            180deg,
            var(--bg-muted),
            transparent
          );
          color: var(--text-muted);
          letter-spacing: 0.2em;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .row {
          display: flex;
          gap: 0.4rem;
          align-items: center;
        }
        .row-label {
          width: 1.2rem;
          font-weight: 700;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
