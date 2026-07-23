/**
 * Automated portion of the README "How to verify" checklist against a running API.
 * Usage: npx tsx scripts/verify-checklist.ts
 */
const API_URL = process.env.API_URL ?? "http://127.0.0.1:4001";
const PARTNER_API_KEY =
  process.env.PARTNER_API_KEY ?? "partner-dev-key-change-me";

type Json = Record<string, unknown>;

async function req(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: Json }> {
  const res = await fetch(`${API_URL}${path}`, init);
  const body = (await res.json().catch(() => ({}))) as Json;
  return { status: res.status, body };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const checks: string[] = [];

  const health = await req("/health");
  assert(health.status === 200 && health.body.ok === true, "health failed");
  checks.push("health ok");

  const userLogin = await req("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "user@cinema.local",
      password: "User1234!",
    }),
  });
  assert(userLogin.status === 200 && userLogin.body.token, "user login failed");
  const userToken = String(userLogin.body.token);
  checks.push("user login");

  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "admin@cinema.local",
      password: "Admin123!",
    }),
  });
  assert(adminLogin.status === 200 && adminLogin.body.token, "admin login failed");
  const adminToken = String(adminLogin.body.token);
  checks.push("admin login");

  const forbidden = await req("/api/admin/metrics", {
    headers: { authorization: `Bearer ${userToken}` },
  });
  assert(forbidden.status === 403, "USER should get 403 on admin metrics");
  checks.push("RBAC 403 for USER");

  await req("/api/admin/seats/reset", {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  checks.push("seats reset");

  const seatsRes = await req("/api/seats/all");
  const seats = (seatsRes.body.data as { id: string; label: string; status: string }[]) ?? [];
  assert(seats.length === 50, `expected 50 seats, got ${seats.length}`);
  const a1 = seats.find((s) => s.label === "A1");
  const a2 = seats.find((s) => s.label === "A2");
  assert(a1 && a2, "A1/A2 missing");

  const [r1, r2] = await Promise.all([
    req("/api/reservations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ seatIds: [a1.id] }),
    }),
    req("/api/reservations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ seatIds: [a1.id] }),
    }),
  ]);
  const success = [r1, r2].filter((r) => r.status === 201);
  const conflict = [r1, r2].filter((r) => r.status === 409);
  assert(success.length === 1, "exactly one concurrent reserve should win");
  assert(conflict.length === 1, "loser should be 409");
  checks.push("same-seat conflict (1 win / 1 x 409)");

  const partner = await req("/api/v1/partner/reservations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": PARTNER_API_KEY,
    },
    body: JSON.stringify({ seatIds: [a2.id] }),
  });
  assert(partner.status === 201, "partner reserve failed");
  checks.push("partner reserve");

  const sim = await req("/api/admin/simulate/concurrency", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ concurrentUsers: 40, seatPoolSize: 3 }),
  });
  assert(sim.status === 200, "simulation failed");
  assert(
    Number(sim.body.duplicateSeatViolations) === 0,
    `simulation double-book: ${sim.body.duplicateSeatViolations}`,
  );
  checks.push(
    `simulation ok (success=${sim.body.successCount}, duplicates=0)`,
  );

  const logs = await req("/api/admin/activity-logs?page=1&pageSize=5", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert(logs.status === 200, "activity logs failed");
  assert(Array.isArray(logs.body.data), "activity logs missing data");
  checks.push("activity logs list");

  console.log("VERIFY PASSED");
  for (const c of checks) console.log(` - ${c}`);
}

main().catch((err) => {
  console.error("VERIFY FAILED", err);
  process.exit(1);
});
