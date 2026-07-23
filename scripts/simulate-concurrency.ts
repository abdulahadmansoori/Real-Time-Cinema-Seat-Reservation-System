/**
 * Standalone concurrency simulation against a running API.
 * Usage: npm run simulate
 * Env: API_URL, PARTNER_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const PARTNER_API_KEY =
  process.env.PARTNER_API_KEY ?? "partner-dev-key-change-me";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@cinema.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";
const CONCURRENT = Number(process.env.CONCURRENT_USERS ?? 100);
const POOL = Number(process.env.SEAT_POOL_SIZE ?? 5);

async function main() {
  const login = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Login failed: ${login.status}`);
  const { token } = (await login.json()) as { token: string };

  await fetch(`${API_URL}/api/admin/seats/reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });

  const seatsRes = await fetch(`${API_URL}/api/seats/all`);
  const { data: seats } = (await seatsRes.json()) as {
    data: { id: string; status: string }[];
  };
  const pool = seats.filter((s) => s.status === "AVAILABLE").slice(0, POOL);

  const results = await Promise.all(
    Array.from({ length: CONCURRENT }, async (_, i) => {
      const seat = pool[i % pool.length];
      const partner = i % 2 === 0;
      const res = partner
        ? await fetch(`${API_URL}/api/v1/partner/reservations`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": PARTNER_API_KEY,
            },
            body: JSON.stringify({ seatIds: [seat.id] }),
          })
        : await fetch(`${API_URL}/api/reservations`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ seatIds: [seat.id] }),
          });
      const body = (await res.json().catch(() => ({}))) as {
        seatIds?: string[];
      };
      return { ok: res.ok, seatIds: body.seatIds ?? [seat.id], partner };
    }),
  );

  const success = results.filter((r) => r.ok);
  const reserved = success.flatMap((r) => r.seatIds);
  const unique = new Set(reserved);
  const summary = {
    totalRequests: CONCURRENT,
    successCount: success.length,
    failureCount: CONCURRENT - success.length,
    uniqueSeatsReserved: unique.size,
    duplicateSeatViolations: reserved.length - unique.size,
    frontendSuccess: success.filter((r) => !r.partner).length,
    partnerSuccess: success.filter((r) => r.partner).length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.duplicateSeatViolations > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
