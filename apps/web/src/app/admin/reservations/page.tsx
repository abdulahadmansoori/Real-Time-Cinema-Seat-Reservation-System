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

function AdminReservationsInner() {
  const { values, setValue, setMany, page, pageSize } = useQueryFilters({
    page: "1",
    pageSize: "20",
    status: "",
    source: "",
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
      if (values.source) params.set("source", values.source);
      if (values.q) params.set("q", values.q);
      setData(
        await apiFetch<PaginatedReservations>(
          `/api/admin/reservations?${params}`,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, values.status, values.source, values.q]);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  return (
    <AuthedShell title="All reservations" admin>
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
            {
              key: "source",
              label: "Source",
              type: "select",
              options: [
                { label: "FRONTEND", value: "FRONTEND" },
                { label: "PARTNER", value: "PARTNER" },
              ],
            },
            {
              key: "q",
              label: "Search",
              type: "text",
              placeholder: "email",
            },
          ]}
          values={values}
          onChange={setValue}
          onSubmit={() => void load()}
        />
        {loading && !data ? (
          <TableSkeleton cols={5} rows={6} />
        ) : (
          <>
            <DataTable<ReservationDto>
              rows={data?.data ?? []}
              columns={[
                {
                  key: "user",
                  header: "Customer",
                  render: (r) => r.userEmail ?? "—",
                },
                {
                  key: "seats",
                  header: "Seats",
                  render: (r) => <SeatChips labels={r.seatLabels} />,
                },
                {
                  key: "source",
                  header: "Source",
                  render: (r) => <Badge tone="info">{r.source}</Badge>,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <Badge>{r.status}</Badge>,
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
                      <Button
                        variant="danger"
                        onClick={async () => {
                          await apiFetch(`/api/admin/reservations/${r.id}`, {
                            method: "DELETE",
                          });
                          await load();
                        }}
                      >
                        Force cancel
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

export default function AdminReservationsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminReservationsInner />
    </Suspense>
  );
}
