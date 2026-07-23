"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import type { PaginatedReservations, ReservationDto } from "@cinema/shared";
import { AuthedShell } from "@/components/layout/Providers";
import { apiFetch } from "@/lib/api";
import { useQueryFilters } from "@/lib/useQueryFilters";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar } from "@/components/ui/FilterBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExpiryCountdown } from "@/components/ui/ExpiryCountdown";
import { SeatChips } from "@/components/seats/SeatChips";
import { TableSkeleton } from "@/components/ui/Skeleton";

function statusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "CANCELLED") return "warning" as const;
  return "muted" as const;
}

function MyReservationsInner() {
  const { values, setValue, setMany, page, pageSize } = useQueryFilters({
    page: "1",
    pageSize: "20",
    status: "",
    q: "",
  });
  const [data, setData] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (values.status) params.set("status", values.status);
      if (values.q) params.set("q", values.q);
      setData(
        await apiFetch<PaginatedReservations>(`/api/me/reservations?${params}`),
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, values.status, values.q]);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  async function cancel(id: string) {
    await apiFetch(`/api/reservations/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AuthedShell
      title="My reservations"
      subtitle="Active bookings expire automatically after the TTL."
    >
      <Card>
        <FilterBar
          fields={[
            {
              key: "status",
              label: "Status",
              type: "select",
              options: [
                { label: "ACTIVE", value: "ACTIVE" },
                { label: "CANCELLED", value: "CANCELLED" },
                { label: "EXPIRED", value: "EXPIRED" },
              ],
            },
            { key: "q", label: "Search", type: "text", placeholder: "seats" },
          ]}
          values={values}
          onChange={setValue}
          onSubmit={() => void load()}
        />
        {loading && !data ? (
          <TableSkeleton cols={4} rows={6} />
        ) : (
          <>
            <DataTable<ReservationDto>
              rows={data?.data ?? []}
              columns={[
                {
                  key: "seats",
                  header: "Seats",
                  render: (r) => <SeatChips labels={r.seatLabels} />,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => (
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  ),
                },
                {
                  key: "created",
                  header: "Booked",
                  render: (r) => new Date(r.createdAt).toLocaleString(),
                },
                {
                  key: "expires",
                  header: "Expires in",
                  render: (r) => (
                    <ExpiryCountdown
                      expiresAt={r.expiresAt}
                      active={r.status === "ACTIVE"}
                    />
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) =>
                    r.status === "ACTIVE" ? (
                      <Button variant="danger" onClick={() => cancel(r.id)}>
                        Cancel
                      </Button>
                    ) : null,
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

export default function MyReservationsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <MyReservationsInner />
    </Suspense>
  );
}
