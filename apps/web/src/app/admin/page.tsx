"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  AdminMetrics,
  PaginatedReservations,
  ReservationDto,
} from "@cinema/shared";
import { AuthedShell } from "@/components/layout/Providers";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { MetricCard } from "@/components/admin/MetricCard";
import { BookingTrendChart } from "@/components/admin/BookingTrendChart";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { SeatChips } from "@/components/seats/SeatChips";
import { MetricsSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

function displayName(email?: string | null) {
  if (!email) return "Admin";
  const local = email.split("@")[0] ?? "Admin";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function statusTone(status: ReservationDto["status"]) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "warning" as const;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recent, setRecent] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      apiFetch<AdminMetrics>("/api/admin/metrics"),
      apiFetch<PaginatedReservations>(
        "/api/admin/reservations?page=1&pageSize=6&sortBy=createdAt&sortOrder=desc",
      ),
    ])
      .then(([m, r]) => {
        setMetrics(m);
        setRecent(r.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const name = displayName(user?.email);

  return (
    <AuthedShell
      title={`Welcome Back, ${name}!`}
      subtitle="Here's what's happening with cinema bookings today."
      admin
      actions={
        <>
          <Link href="/admin/activity" className="ghost-link">
            Last 7 days
          </Link>
          <Link href="/admin/reservations">
            <Button variant="primary">View all bookings</Button>
          </Link>
        </>
      }
    >
      {loading || !metrics ? (
        <div className="stack">
          <MetricsSkeleton />
          <Card fill={false}>
            <TableSkeleton cols={5} rows={4} />
          </Card>
        </div>
      ) : (
        <div className="stack">
          <div className="kpis">
            <MetricCard
              label="Available seats"
              value={metrics.available}
              tone="mint"
              delta={`${Math.max(0, 100 - metrics.occupancyPercent)}% free`}
              deltaUp
            />
            <MetricCard
              label="Reserved seats"
              value={metrics.reserved}
              tone="peach"
              delta={`${metrics.occupancyPercent}% occupied`}
              deltaUp={metrics.occupancyPercent < 90}
            />
            <MetricCard
              label="Bookings today"
              value={metrics.reservationsToday}
              tone="sky"
              hint="Created since midnight"
            />
            <MetricCard
              label="Active holds"
              value={metrics.activeReservations}
              tone="amber"
              hint="Not yet expired or cancelled"
            />
            <MetricCard
              label="Failed attempts"
              value={metrics.failedBookingsToday}
              tone="lavender"
              delta={
                metrics.failedBookingsToday === 0
                  ? "No conflicts today"
                  : "Conflicts today"
              }
              deltaUp={metrics.failedBookingsToday === 0}
            />
          </div>

          <div className="mid">
            <Card
              fill={false}
              title="Booking summary"
              subtitle="Reservations vs failed attempts over the last 7 days."
            >
              <div className="legend">
                <span>
                  <i className="dot bookings" /> Bookings
                </span>
                <span>
                  <i className="dot failures" /> Failures
                </span>
                <span className="range">Last 7 days</span>
              </div>
              <BookingTrendChart series={metrics.series} />
            </Card>
          </div>

          <div className="bottom">
            <Card fill={false} title="Recent bookings">
              <DataTable<ReservationDto>
                rows={recent}
                empty="No bookings yet"
                columns={[
                  {
                    key: "seats",
                    header: "Seats",
                    render: (r) => <SeatChips labels={r.seatLabels} />,
                  },
                  {
                    key: "customer",
                    header: "Customer",
                    render: (r) => (
                      <span className="customer">{r.userEmail ?? "—"}</span>
                    ),
                  },
                  {
                    key: "source",
                    header: "Source",
                    render: (r) => r.source,
                  },
                  {
                    key: "date",
                    header: "Date",
                    render: (r) =>
                      new Date(r.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (r) => (
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    ),
                  },
                ]}
              />
            </Card>

            <div className="side">
              <Card fill={false} title="Most booked seats">
                <ul className="list">
                  {metrics.hotSeats.length === 0 ? (
                    <li className="empty">No booking history yet</li>
                  ) : (
                    metrics.hotSeats.map((s) => (
                      <li key={s.label}>
                        <div className="thumb seat">{s.label}</div>
                        <div className="meta">
                          <strong>{s.label}</strong>
                          <span>Seat inventory</span>
                        </div>
                        <span className="stat">{s.count} bookings</span>
                      </li>
                    ))
                  )}
                </ul>
              </Card>

              <Card fill={false} title="Weekly top customers">
                <ul className="list">
                  {metrics.topCustomers.length === 0 ? (
                    <li className="empty">No customers this week</li>
                  ) : (
                    metrics.topCustomers.map((c) => (
                      <li key={c.email}>
                        <div className="thumb avatar">
                          {c.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="meta">
                          <strong>{c.email}</strong>
                          <span>
                            {c.count} order{c.count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <Link href="/admin/reservations" className="view">
                          View
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .kpis {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.85rem;
        }
        .mid {
          display: grid;
          grid-template-columns: 1fr;
        }
        .legend {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .legend .range {
          margin-left: auto;
          font-weight: 600;
        }
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          margin-right: 0.35rem;
        }
        .dot.bookings {
          background: var(--accent);
        }
        .dot.failures {
          background: var(--warning);
        }
        .bottom {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.9fr);
          gap: 1rem;
          align-items: start;
        }
        .side {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .list li {
          display: grid;
          grid-template-columns: 42px 1fr auto;
          gap: 0.75rem;
          align-items: center;
        }
        .list .empty {
          display: block;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .thumb {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 0.78rem;
        }
        .thumb.seat {
          background: var(--mint);
          color: var(--success);
        }
        .thumb.avatar {
          background: var(--lavender);
          color: var(--text);
          border-radius: 999px;
        }
        .meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .meta strong {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .meta span {
          color: var(--text-muted);
          font-size: 0.78rem;
        }
        .stat {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .view {
          color: var(--accent);
          font-size: 0.82rem;
          font-weight: 700;
        }
        :global(.customer) {
          color: #2563eb;
          font-weight: 600;
        }
        :global([data-theme="dark"] .customer) {
          color: #93c5fd;
        }
        :global(.ghost-link) {
          display: inline-flex;
          align-items: center;
          height: 40px;
          padding: 0 0.9rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          font-weight: 600;
          font-size: 0.88rem;
        }
        @media (max-width: 1200px) {
          .kpis {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .bottom {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .kpis {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </AuthedShell>
  );
}
