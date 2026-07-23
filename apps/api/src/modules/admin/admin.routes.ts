import type { FastifyPluginAsync } from "fastify";
import { Role } from "@prisma/client";
import {
  ActorType,
  ActivityAction,
  activityLogsQuerySchema,
  reservationsQuerySchema,
  simulateSchema,
  usersQuerySchema,
  type SimulationResult,
} from "@cinema/shared";
import { prisma } from "../../lib/prisma";
import { paginate } from "../../lib/pagination";
import { env } from "../../config/env";
import { reservationService } from "../reservations/reservation.service";
import { activityLogService } from "../activity/activity.service";

async function runSimulation(
  concurrentUsers: number,
  seatPoolSize: number,
  token: string,
): Promise<SimulationResult> {
  const seats = await reservationService.getAllSeats();
  const available = seats
    .filter((s) => s.status === "AVAILABLE")
    .slice(0, seatPoolSize);
  const pool = available.length
    ? available
    : seats.slice(0, Math.min(seatPoolSize, seats.length));

  const baseUrl = `http://127.0.0.1:${env.API_PORT}`;
  const results = await Promise.all(
    Array.from({ length: concurrentUsers }, async (_, i) => {
      const seat = pool[i % pool.length];
      const usePartner = i % 2 === 0;
      try {
        const res = usePartner
          ? await fetch(`${baseUrl}/api/v1/partner/reservations`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-api-key": env.PARTNER_API_KEY,
              },
              body: JSON.stringify({ seatIds: [seat.id] }),
            })
          : await fetch(`${baseUrl}/api/reservations`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ seatIds: [seat.id] }),
            });
        const body = (await res.json().catch(() => ({}))) as {
          id?: string;
          seatIds?: string[];
        };
        return {
          ok: res.ok,
          source: usePartner ? "PARTNER" : "FRONTEND",
          seatIds: body.seatIds ?? [seat.id],
        };
      } catch {
        return {
          ok: false,
          source: usePartner ? "PARTNER" : "FRONTEND",
          seatIds: [seat.id],
        };
      }
    }),
  );

  const success = results.filter((r) => r.ok);
  const reservedSeatIds = success.flatMap((r) => r.seatIds);
  const unique = new Set(reservedSeatIds);
  const duplicateSeatViolations = reservedSeatIds.length - unique.size;

  return {
    totalRequests: concurrentUsers,
    successCount: success.length,
    failureCount: concurrentUsers - success.length,
    uniqueSeatsReserved: unique.size,
    duplicateSeatViolations,
    frontendSuccess: success.filter((r) => r.source === "FRONTEND").length,
    partnerSuccess: success.filter((r) => r.source === "PARTNER").length,
  };
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  const adminOnly = { preHandler: [app.requireRole(Role.ADMIN)] };

  app.get("/api/admin/activity-logs", adminOnly, async (request) => {
    const query = activityLogsQuerySchema.parse(request.query);
    return activityLogService.list(query);
  });

  app.get("/api/admin/reservations", adminOnly, async (request) => {
    const query = reservationsQuerySchema.parse(request.query);
    return reservationService.listReservations(query);
  });

  app.delete("/api/admin/reservations/:id", adminOnly, async (request) => {
    const { id } = request.params as { id: string };
    return reservationService.cancel({
      reservationId: id,
      requesterId: request.user!.sub,
      isAdmin: true,
      ip: request.ip,
      requestId: request.requestId,
      log: request.log,
    });
  });

  app.get("/api/admin/users", adminOnly, async (request) => {
    const query = usersQuerySchema.parse(request.query);
    const where: {
      role?: Role;
      email?: { contains: string; mode: "insensitive" };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (query.role) where.role = query.role as Role;
    if (query.q) where.email = { contains: query.q, mode: "insensitive" };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    const orderBy =
      query.sortBy === "email"
        ? { email: query.sortOrder }
        : query.sortBy === "role"
          ? { role: query.sortOrder }
          : { createdAt: query.sortOrder };

    const result = await paginate({
      page: query.page,
      pageSize: query.pageSize,
      findMany: ({ skip, take }) =>
        prisma.user.findMany({
          where,
          orderBy,
          skip,
          take,
          select: { id: true, email: true, role: true, createdAt: true },
        }),
      count: () => prisma.user.count({ where }),
    });

    return {
      data: result.data.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      meta: result.meta,
    };
  });

  app.post("/api/admin/seats/reset", adminOnly, async (request) => {
    const seats = await reservationService.resetAllSeats(
      request.user!.sub,
      request.requestId,
    );
    return { data: seats };
  });

  app.get("/api/admin/metrics", adminOnly, async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const [
      availability,
      todayCount,
      failedToday,
      activeReservations,
      usersCount,
      weekReservations,
      weekFailures,
      hotSeatGroups,
      topCustomerGroups,
    ] = await Promise.all([
      reservationService.availability(),
      prisma.reservation.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.activityLog.count({
        where: {
          action: ActivityAction.RESERVATION_FAILED,
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.reservation.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.reservation.findMany({
        where: { createdAt: { gte: weekStart } },
        select: { createdAt: true },
      }),
      prisma.activityLog.findMany({
        where: {
          action: ActivityAction.RESERVATION_FAILED,
          createdAt: { gte: weekStart },
        },
        select: { createdAt: true },
      }),
      prisma.reservationSeat.groupBy({
        by: ["seatId"],
        _count: { seatId: true },
        orderBy: { _count: { seatId: "desc" } },
        take: 5,
      }),
      prisma.reservation.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: weekStart } },
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      }),
    ]);

    const dayKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const bookingBuckets = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    const failureBuckets = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    for (const row of weekReservations) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (key in bookingBuckets) bookingBuckets[key] += 1;
    }
    for (const row of weekFailures) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (key in failureBuckets) failureBuckets[key] += 1;
    }

    const seatIds = hotSeatGroups.map((g) => g.seatId);
    const userIds = topCustomerGroups.map((g) => g.userId);
    const [seats, users] = await Promise.all([
      seatIds.length
        ? prisma.seat.findMany({
            where: { id: { in: seatIds } },
            select: { id: true, label: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true },
          })
        : Promise.resolve([]),
    ]);
    const seatMap = Object.fromEntries(seats.map((s) => [s.id, s.label]));
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

    const occupancyPercent =
      availability.total === 0
        ? 0
        : Math.round((availability.reserved / availability.total) * 100);

    return {
      ...availability,
      occupancyPercent,
      reservationsToday: todayCount,
      failedBookingsToday: failedToday,
      activeReservations,
      usersCount,
      series: dayKeys.map((day) => ({
        day,
        label: new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
          weekday: "short",
        }),
        bookings: bookingBuckets[day] ?? 0,
        failures: failureBuckets[day] ?? 0,
      })),
      hotSeats: hotSeatGroups.map((g) => ({
        label: seatMap[g.seatId] ?? "Seat",
        count: g._count.seatId,
      })),
      topCustomers: topCustomerGroups.map((g) => ({
        email: userMap[g.userId] ?? "Unknown",
        count: g._count.userId,
      })),
    };
  });

  app.post("/api/admin/simulate/concurrency", adminOnly, async (request) => {
    const body = simulateSchema.parse(request.body ?? {});
    await activityLogService.log({
      actorId: request.user!.sub,
      actorType: ActorType.ADMIN,
      action: ActivityAction.SIMULATION_STARTED,
      metadata: body,
      ip: request.ip,
    });

    const token = await app.jwt.sign({
      sub: request.user!.sub,
      email: request.user!.email,
      role: request.user!.role,
    });

    const result = await runSimulation(
      body.concurrentUsers,
      body.seatPoolSize,
      token,
    );

    await activityLogService.log({
      actorId: request.user!.sub,
      actorType: ActorType.ADMIN,
      action: ActivityAction.SIMULATION_COMPLETED,
      metadata: result as unknown as Record<string, unknown>,
      ip: request.ip,
    });

    return result;
  });
};
