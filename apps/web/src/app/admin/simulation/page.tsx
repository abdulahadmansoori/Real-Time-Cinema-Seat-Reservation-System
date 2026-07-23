"use client";

import { useState } from "react";
import type { SimulationResult } from "@cinema/shared";
import { AuthedShell } from "@/components/layout/Providers";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/admin/MetricCard";

export default function SimulationPage() {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSim() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<SimulationResult>(
        "/api/admin/simulate/concurrency",
        {
          method: "POST",
          body: JSON.stringify({ concurrentUsers: 100, seatPoolSize: 5 }),
          retry: 0,
        },
      );
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  async function resetSeats() {
    setResetting(true);
    try {
      await apiFetch("/api/admin/seats/reset", { method: "POST" });
    } finally {
      setResetting(false);
    }
  }

  return (
    <AuthedShell title="Concurrency simulation" admin>
      <Card
        title="100 concurrent users"
        subtitle="Mixed frontend JWT + partner API key traffic against the same seat pool."
      >
        <div className="actions">
          <Button onClick={runSim} loading={loading}>
            Run simulation
          </Button>
          <Button variant="secondary" onClick={resetSeats} loading={resetting}>
            Reset all seats
          </Button>
        </div>
        {error ? <p className="err">{error}</p> : null}
        {result ? (
          <div className="grid">
            <MetricCard label="Total requests" value={result.totalRequests} />
            <MetricCard
              label="Success"
              value={result.successCount}
              tone="success"
            />
            <MetricCard
              label="Failures"
              value={result.failureCount}
              tone="warning"
            />
            <MetricCard
              label="Unique seats reserved"
              value={result.uniqueSeatsReserved}
            />
            <MetricCard
              label="Duplicate violations"
              value={result.duplicateSeatViolations}
              tone={result.duplicateSeatViolations === 0 ? "success" : "danger"}
            />
            <MetricCard
              label="Frontend wins"
              value={result.frontendSuccess}
            />
            <MetricCard label="Partner wins" value={result.partnerSuccess} />
          </div>
        ) : null}
      </Card>
      <style jsx>{`
        .actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .err {
          color: var(--danger);
        }
      `}</style>
    </AuthedShell>
  );
}
