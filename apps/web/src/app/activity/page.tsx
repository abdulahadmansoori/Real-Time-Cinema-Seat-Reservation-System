"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import type { ActivityLogDto, PaginatedActivityLogs } from "@cinema/shared";
import { AuthedShell } from "@/components/layout/Providers";
import { apiFetch } from "@/lib/api";
import { useQueryFilters } from "@/lib/useQueryFilters";
import { dayEndIso, dayStartIso } from "@/lib/dateRange";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar } from "@/components/ui/FilterBar";
import { Badge } from "@/components/ui/Badge";
import { SeatChips } from "@/components/seats/SeatChips";
import { TableSkeleton } from "@/components/ui/Skeleton";

const ACTION_LABELS: Record<string, string> = {
  RESERVATION_CREATED: "Reservation created",
  RESERVATION_CANCELLED: "Reservation cancelled",
  RESERVATION_EXPIRED: "Reservation expired",
  RESERVATION_FAILED: "Reservation failed",
  LOGIN_SUCCESS: "Signed in",
  LOGIN_FAILED: "Sign-in failed",
  USER_REGISTERED: "Account created",
  SIMULATION_STARTED: "Simulation started",
  SIMULATION_COMPLETED: "Simulation completed",
  SEATS_RESET: "Seats reset",
};

function detailFor(log: ActivityLogDto) {
  const meta = log.metadata ?? {};
  if (Array.isArray(meta.seatLabels) && meta.seatLabels.length) {
    return <SeatChips labels={meta.seatLabels as string[]} />;
  }
  if (Array.isArray(meta.seatIds) && meta.seatIds.length) {
    return `${meta.seatIds.length} seat(s)`;
  }
  if (typeof meta.source === "string") return String(meta.source);
  if (log.entityType === "Reservation") return "Reservation";
  if (log.entityType === "User") return "Account";
  if (log.entityType === "Seat") return "Seats";
  return "—";
}

function MyActivityInner() {
  const { values, setValue, setMany, page, pageSize } = useQueryFilters({
    page: "1",
    pageSize: "20",
    action: "",
    q: "",
    from: "",
    to: "",
  });
  const [data, setData] = useState<PaginatedActivityLogs | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (values.action) params.set("action", values.action);
      if (values.q) params.set("q", values.q);
      const from = dayStartIso(values.from ?? "");
      const to = dayEndIso(values.to ?? "");
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      setData(
        await apiFetch<PaginatedActivityLogs>(
          `/api/me/activity-logs?${params}`,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, values.action, values.q, values.from, values.to]);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  return (
    <AuthedShell
      title="My activity"
      subtitle="Your reservation and login events."
    >
      <Card>
        <FilterBar
          fields={[
            {
              key: "action",
              label: "Action",
              type: "select",
              options: [
                { label: "Reservation created", value: "RESERVATION_CREATED" },
                {
                  label: "Reservation cancelled",
                  value: "RESERVATION_CANCELLED",
                },
                { label: "Signed in", value: "LOGIN_SUCCESS" },
              ],
            },
            { key: "from", label: "From", type: "date" },
            { key: "to", label: "To", type: "date" },
            { key: "q", label: "Search", type: "text" },
          ]}
          values={values}
          onChange={setValue}
          onSubmit={() => {
            setMany({ page: "1" });
            void load();
          }}
        />
        {loading && !data ? (
          <TableSkeleton cols={3} rows={8} />
        ) : (
          <>
            <DataTable<ActivityLogDto>
              rows={data?.data ?? []}
              columns={[
                {
                  key: "action",
                  header: "Event",
                  render: (r) => (
                    <Badge tone="info">
                      {ACTION_LABELS[r.action] ?? r.action}
                    </Badge>
                  ),
                },
                {
                  key: "detail",
                  header: "Details",
                  render: (r) => detailFor(r),
                },
                {
                  key: "when",
                  header: "When",
                  render: (r) => new Date(r.createdAt).toLocaleString(),
                },
              ]}
            />
            {data ? (
              <Pagination
                meta={data.meta}
                onPageChange={(p) => setMany({ page: String(p) })}
                onPageSizeChange={(s) =>
                  setMany({ pageSize: String(s), page: "1" })
                }
              />
            ) : null}
          </>
        )}
      </Card>
    </AuthedShell>
  );
}

export default function MyActivityPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <MyActivityInner />
    </Suspense>
  );
}
