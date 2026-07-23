import {
  type ReservationDto,
  type SeatDto,
  ReservationSource,
  ReservationStatus,
  SeatStatus,
  reservationsQuerySchema,
} from "@cinema/shared";
import {
  Prisma,
  ReservationSource as PrismaSource,
  ReservationStatus as PrismaResStatus,
  SeatStatus as PrismaSeatStatus,
  ActorType,
  Role,
} from "@prisma/client";
import { z } from "zod";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { paginate } from "../../lib/pagination";
import { notFound, seatsUnavailable } from "../../lib/errors";
import { emitSeatsUpdated } from "../../lib/socket-emit";
import {
  activityLogService,
  ActivityAction,
} from "../activity/activity.service";

type ReserveArgs = {
  userId: string;
  seatIds: string[];
  source: (typeof ReservationSource)[keyof typeof ReservationSource];
  actorType: (typeof ActorType)[keyof typeof ActorType];
  ip?: string | null;
  requestId?: string;
  log?: {
    info: (obj: object, msg?: string) => void;
    warn: (obj: object, msg?: string) => void;
  };
};

function mapSeat(s: {
  id: string;
  label: string;
  status: string;
  updatedAt: Date;
}): SeatDto {
  return {
    id: s.id,
    label: s.label,
    status: s.status as SeatDto["status"],
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapReservation(r: {
  id: string;
  userId: string;
  source: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  user?: { email: string } | null;
  seats: { seat: { id: string; label: string } }[];
}): ReservationDto {
  return {
    id: r.id,
    userId: r.userId,
    userEmail: r.user?.email,
    source: r.source as ReservationDto["source"],
    status: r.status as ReservationDto["status"],
    seatIds: r.seats.map((s) => s.seat.id),
    seatLabels: r.seats.map((s) => s.seat.label),
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  };
}

export class ReservationService {
  async listSeats(query: {
    page: number;
    pageSize: number;
    status?: string;
    q?: string;
    row?: string;
    sortBy: "label" | "status" | "updatedAt";
    sortOrder: "asc" | "desc";
  }) {
    const where: Prisma.SeatWhereInput = {};
    if (query.status) where.status = query.status as PrismaSeatStatus;
    if (query.row && query.q) {
      where.AND = [
        { label: { startsWith: query.row } },
        { label: { contains: query.q, mode: "insensitive" } },
      ];
    } else if (query.row) {
      where.label = { startsWith: query.row };
    } else if (query.q) {
      where.label = { contains: query.q, mode: "insensitive" };
    }

    const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.SeatOrderByWithRelationInput;

    const result = await paginate({
      page: query.page,
      pageSize: query.pageSize,
      findMany: ({ skip, take }) =>
        prisma.seat.findMany({ where, orderBy, skip, take }),
      count: () => prisma.seat.count({ where }),
    });

    return {
      data: result.data.map(mapSeat),
      meta: result.meta,
    };
  }

  async getAllSeats(): Promise<SeatDto[]> {
    const seats = await prisma.seat.findMany({ orderBy: { label: "asc" } });
    return seats.map(mapSeat);
  }

  async availability() {
    const [available, reserved, total] = await Promise.all([
      prisma.seat.count({ where: { status: PrismaSeatStatus.AVAILABLE } }),
      prisma.seat.count({ where: { status: PrismaSeatStatus.RESERVED } }),
      prisma.seat.count(),
    ]);
    return { available, reserved, total };
  }

  async reserve(args: ReserveArgs): Promise<ReservationDto> {
    const started = Date.now();
    const uniqueSeatIds = [...new Set(args.seatIds)].sort();
    const expiresAt = new Date(Date.now() + env.RESERVATION_TTL_MS);

    try {
      const reservation = await prisma.$transaction(async (tx) => {
        const seats = await tx.$queryRaw<
          { id: string; label: string; status: string }[]
        >`
          SELECT id, label, status
          FROM "Seat"
          WHERE id IN (${Prisma.join(uniqueSeatIds)})
          ORDER BY id
          FOR UPDATE
        `;

        if (seats.length !== uniqueSeatIds.length) {
          throw notFound("One or more seats not found");
        }

        const unavailable = seats.filter(
          (s) => s.status !== PrismaSeatStatus.AVAILABLE,
        );
        if (unavailable.length > 0) {
          throw seatsUnavailable(unavailable.map((s) => s.id));
        }

        await tx.seat.updateMany({
          where: { id: { in: uniqueSeatIds } },
          data: { status: PrismaSeatStatus.RESERVED },
        });

        const created = await tx.reservation.create({
          data: {
            userId: args.userId,
            source: args.source as PrismaSource,
            status: PrismaResStatus.ACTIVE,
            expiresAt,
            seats: {
              create: uniqueSeatIds.map((seatId) => ({ seatId })),
            },
          },
          include: {
            user: { select: { email: true } },
            seats: { include: { seat: true } },
          },
        });

        return created;
      });

      const dto = mapReservation(reservation);
      const allSeats = await this.getAllSeats();
      emitSeatsUpdated(allSeats);

      await activityLogService.log({
        actorId: args.userId,
        actorType: args.actorType,
        action: ActivityAction.RESERVATION_CREATED,
        entityType: "Reservation",
        entityId: reservation.id,
        metadata: {
          seatIds: uniqueSeatIds,
          seatLabels: reservation.seats.map((s) => s.seat.label),
          source: args.source,
          requestId: args.requestId,
        },
        ip: args.ip,
      });

      args.log?.info(
        {
          requestId: args.requestId,
          userId: args.userId,
          reservationId: reservation.id,
          seatIds: uniqueSeatIds,
          source: args.source,
          outcome: "success",
          durationMs: Date.now() - started,
        },
        "reservation created",
      );

      return dto;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        const appErr = err as { code: string; details?: { seatIds?: string[] } };
        if (appErr.code === "SEATS_UNAVAILABLE") {
          await activityLogService.log({
            actorId: args.userId,
            actorType: args.actorType,
            action: ActivityAction.RESERVATION_FAILED,
            entityType: "Seat",
            metadata: {
              seatIds: uniqueSeatIds,
              source: args.source,
              conflictSeatIds: appErr.details?.seatIds,
              requestId: args.requestId,
            },
            ip: args.ip,
          });
          args.log?.warn(
            {
              requestId: args.requestId,
              userId: args.userId,
              seatIds: uniqueSeatIds,
              source: args.source,
              outcome: "conflict",
              durationMs: Date.now() - started,
            },
            "reservation conflict",
          );
        }
      }
      throw err;
    }
  }

  async cancel(args: {
    reservationId: string;
    requesterId: string;
    isAdmin: boolean;
    ip?: string | null;
    requestId?: string;
    log?: ReserveArgs["log"];
  }) {
    const started = Date.now();
    const reservation = await prisma.reservation.findUnique({
      where: { id: args.reservationId },
      include: { seats: true },
    });
    if (!reservation) throw notFound("Reservation not found");
    if (!args.isAdmin && reservation.userId !== args.requesterId) {
      throw notFound("Reservation not found");
    }
    if (reservation.status !== PrismaResStatus.ACTIVE) {
      return mapReservation({
        ...reservation,
        seats: [],
        user: null,
      });
    }

    const seatIds = reservation.seats.map((s) => s.seatId);

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: PrismaResStatus.CANCELLED },
      });
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: PrismaSeatStatus.AVAILABLE },
      });
    });

    const allSeats = await this.getAllSeats();
    emitSeatsUpdated(allSeats);

    await activityLogService.log({
      actorId: args.requesterId,
      actorType: args.isAdmin ? ActorType.ADMIN : ActorType.USER,
      action: ActivityAction.RESERVATION_CANCELLED,
      entityType: "Reservation",
      entityId: reservation.id,
      metadata: { seatIds, requestId: args.requestId },
      ip: args.ip,
    });

    args.log?.info(
      {
        requestId: args.requestId,
        userId: args.requesterId,
        reservationId: reservation.id,
        seatIds,
        outcome: "success",
        durationMs: Date.now() - started,
      },
      "reservation cancelled",
    );

    const updated = await prisma.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
      include: {
        user: { select: { email: true } },
        seats: { include: { seat: true } },
      },
    });
    return mapReservation(updated);
  }

  async expireDue() {
    const due = await prisma.reservation.findMany({
      where: {
        status: PrismaResStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
      include: { seats: true },
      take: 100,
    });

    let expired = 0;
    for (const reservation of due) {
      const seatIds = reservation.seats.map((s) => s.seatId);
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.reservation.findUnique({
          where: { id: reservation.id },
        });
        if (!current || current.status !== PrismaResStatus.ACTIVE) return false;
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: PrismaResStatus.EXPIRED },
        });
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { status: PrismaSeatStatus.AVAILABLE },
        });
        return true;
      });

      if (result) {
        expired += 1;
        await activityLogService.log({
          actorId: null,
          actorType: ActorType.SYSTEM,
          action: ActivityAction.RESERVATION_EXPIRED,
          entityType: "Reservation",
          entityId: reservation.id,
          metadata: { seatIds },
        });
      }
    }

    if (expired > 0) {
      const allSeats = await this.getAllSeats();
      emitSeatsUpdated(allSeats);
    }
    return expired;
  }

  async resetAllSeats(actorId: string, requestId?: string) {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.updateMany({
        where: { status: PrismaResStatus.ACTIVE },
        data: { status: PrismaResStatus.CANCELLED },
      });
      await tx.seat.updateMany({
        data: { status: PrismaSeatStatus.AVAILABLE },
      });
    });

    const seats = await this.getAllSeats();
    emitSeatsUpdated(seats);

    await activityLogService.log({
      actorId,
      actorType: ActorType.ADMIN,
      action: ActivityAction.SEATS_RESET,
      entityType: "Seat",
      metadata: { requestId },
    });

    return seats;
  }

  async listReservations(
    query: z.infer<typeof reservationsQuerySchema>,
    forceUserId?: string,
  ) {
    const where: Prisma.ReservationWhereInput = {};
    if (forceUserId) where.userId = forceUserId;
    else if (query.userId) where.userId = query.userId;
    if (query.source) where.source = query.source as PrismaSource;
    if (query.status) where.status = query.status as PrismaResStatus;
    if (query.seatId) {
      where.seats = { some: { seatId: query.seatId } };
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.q) {
      where.OR = [
        { id: { contains: query.q, mode: "insensitive" } },
        { user: { email: { contains: query.q, mode: "insensitive" } } },
      ];
    }

    const orderBy =
      query.sortBy === "expiresAt"
        ? { expiresAt: query.sortOrder }
        : query.sortBy === "id"
          ? { id: query.sortOrder }
          : { createdAt: query.sortOrder };

    const result = await paginate({
      page: query.page,
      pageSize: query.pageSize,
      findMany: ({ skip, take }) =>
        prisma.reservation.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            user: { select: { email: true } },
            seats: { include: { seat: true } },
          },
        }),
      count: () => prisma.reservation.count({ where }),
    });

    return {
      data: result.data.map(mapReservation),
      meta: result.meta,
    };
  }
}

export const reservationService = new ReservationService();
