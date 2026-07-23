import { describe, it, expect } from "vitest";
import { buildApp } from "./app";

/**
 * Concurrent reservation correctness is covered when DATABASE_URL is set.
 * This smoke test ensures the app boots and health works without DB for CI scaffolding.
 */
describe("API smoke", () => {
  it("health returns ok", async () => {
    process.env.DATABASE_URL ??=
      "postgresql://cinema:cinema@localhost:5432/cinema?schema=public";
    process.env.JWT_SECRET ??= "test-secret-key-min-8";
    process.env.ADMIN_PASSWORD ??= "Admin123!";
    process.env.PARTNER_API_KEY ??= "partner-test-key";

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });
});
