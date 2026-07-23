/**
 * Integration test: concurrent overlapping reserves must never double-book.
 * Requires DATABASE_URL pointing at a running Postgres with migrations applied.
 * Skips automatically when SKIP_DB_TESTS=1 or DB unreachable.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { reservationService } from "./reservation.service";
import { ReservationSource, ActorType } from "@prisma/client";

const prisma = new PrismaClient();
const run = process.env.SKIP_DB_TESTS !== "1";

describe.runIf(run)("concurrent reservations", () => {
  let userIds: string[] = [];
  let seatIds: string[] = [];

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      process.env.SKIP_DB_TESTS = "1";
      return;
    }

    await prisma.reservationSeat.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.seat.updateMany({ data: { status: "AVAILABLE" } });

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("test", 4);
    for (let i = 0; i < 40; i++) {
      await prisma.user.upsert({
        where: { email: `concurrent${i}@test.local` },
        update: {},
        create: {
          email: `concurrent${i}@test.local`,
          passwordHash: hash,
          role: "USER",
        },
      });
    }
    userIds = (
      await prisma.user.findMany({
        where: { email: { startsWith: "concurrent" } },
        take: 40,
      })
    ).map((u) => u.id);
    seatIds = (
      await prisma.seat.findMany({ take: 5, orderBy: { label: "asc" } })
    ).map((s) => s.id);
  });

  it("never assigns the same seat to two successful reservations", async () => {
    if (process.env.SKIP_DB_TESTS === "1" || seatIds.length === 0) return;

    const target = seatIds[0];
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        reservationService.reserve({
          userId,
          seatIds: [target],
          source: ReservationSource.FRONTEND,
          actorType: ActorType.USER,
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(userIds.length - 1);

    const seat = await prisma.seat.findUniqueOrThrow({ where: { id: target } });
    expect(seat.status).toBe("RESERVED");
  });
});
