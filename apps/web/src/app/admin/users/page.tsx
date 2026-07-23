"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import type { PaginatedUsers, UserDto } from "@cinema/shared";
import { AuthedShell } from "@/components/layout/Providers";
import { apiFetch } from "@/lib/api";
import { useQueryFilters } from "@/lib/useQueryFilters";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar } from "@/components/ui/FilterBar";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";

function AdminUsersInner() {
  const { values, setValue, setMany, page, pageSize } = useQueryFilters({
    page: "1",
    pageSize: "20",
    role: "",
    q: "",
  });
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (values.role) params.set("role", values.role);
      if (values.q) params.set("q", values.q);
      setData(await apiFetch<PaginatedUsers>(`/api/admin/users?${params}`));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, values.role, values.q]);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  return (
    <AuthedShell title="Manage users" admin>
      <Card>
        <FilterBar
          fields={[
            {
              key: "role",
              label: "Role",
              type: "select",
              options: [
                { label: "USER", value: "USER" },
                { label: "ADMIN", value: "ADMIN" },
              ],
            },
            { key: "q", label: "Email", type: "text" },
          ]}
          values={values}
          onChange={setValue}
          onSubmit={() => void load()}
        />
        {loading && !data ? (
          <TableSkeleton cols={3} rows={6} />
        ) : (
          <>
            <DataTable<UserDto>
              rows={data?.data ?? []}
              columns={[
                { key: "email", header: "Email", render: (r) => r.email },
                {
                  key: "role",
                  header: "Role",
                  render: (r) => (
                    <Badge tone={r.role === "ADMIN" ? "warning" : "muted"}>
                      {r.role}
                    </Badge>
                  ),
                },
                {
                  key: "created",
                  header: "Created",
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

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminUsersInner />
    </Suspense>
  );
}
