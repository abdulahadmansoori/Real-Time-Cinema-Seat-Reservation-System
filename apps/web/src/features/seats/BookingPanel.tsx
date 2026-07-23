"use client";

import { useEffect, useState } from "react";
import type { SeatDto } from "@cinema/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { onSeatsUpdated } from "@/lib/socket";
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { SeatChips } from "@/components/seats/SeatChips";
import { SeatGridSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function BookingPanel() {
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookedLabels, setBookedLabels] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ data: SeatDto[] }>("/api/seats/all", {
          auth: false,
        });
        if (!cancelled) setSeats(res.data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load seats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onSeatsUpdated((payload) => {
      setSeats(payload.seats);
      setSelected((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          const seat = payload.seats.find((s) => s.id === id);
          if (seat && seat.status === "AVAILABLE") next.add(id);
        }
        return next;
      });
    });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function reserve() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    setBookedLabels(null);

    const seatIds = [...selected];
    // Optimistic UI: mark selected as reserved locally
    const snapshot = seats;
    setSeats((prev) =>
      prev.map((s) =>
        selected.has(s.id) ? { ...s, status: "RESERVED" as const } : s,
      ),
    );
    setSelected(new Set());

    try {
      const reservation = await apiFetch<{ id: string; seatLabels: string[] }>(
        "/api/reservations",
        {
          method: "POST",
          body: JSON.stringify({ seatIds }),
        },
      );
      setBookedLabels(reservation.seatLabels);
    } catch (e) {
      setSeats(snapshot);
      setSelected(new Set(seatIds));
      if (e instanceof ApiError) {
        setError(e.message + (e.requestId ? ` [${e.requestId}]` : ""));
      } else {
        setError(e instanceof Error ? e.message : "Reserve failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card title="Select your seats" subtitle="Loading seat map…">
        <SeatGridSkeleton />
      </Card>
    );
  }

  return (
    <Card
      title="Select your seats"
      subtitle="Live updates from other users. Optimistic reserve with rollback on conflict."
    >
      <SeatLegend />
      <SeatGrid seats={seats} selected={selected} onToggle={toggle} />
      <div className="actions">
        <Button
          onClick={reserve}
          loading={submitting}
          disabled={selected.size === 0}
        >
          Reserve {selected.size ? `(${selected.size})` : ""}
        </Button>
      </div>
      {bookedLabels ? (
        <div className="ok">
          <span>Reserved</span>
          <SeatChips labels={bookedLabels} />
        </div>
      ) : null}
      {error ? <p className="err">{error}</p> : null}
      <style jsx>{`
        .actions {
          margin-top: 1.25rem;
          display: flex;
          justify-content: center;
        }
        .ok {
          margin-top: 1rem;
          color: var(--success);
          display: flex;
          gap: 0.55rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          font-weight: 600;
        }
        .err {
          color: var(--danger);
          text-align: center;
        }
      `}</style>
    </Card>
  );
}
