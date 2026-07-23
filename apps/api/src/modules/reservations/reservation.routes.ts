import type { FastifyPluginAsync } from "fastify";
import {
  ActorType,
  ReservationSource,
  activityLogsQuerySchema,
  reservationsQuerySchema,
  reserveSchema,
} from "@cinema/shared";
import { reservationService } from "./reservation.service";
import { activityLogService } from "../activity/activity.service";

export const reservationRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/api/reservations",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const body = reserveSchema.parse(request.body);
      const reservation = await reservationService.reserve({
        userId: request.user!.sub,
        seatIds: body.seatIds,
        source: ReservationSource.FRONTEND,
        actorType:
          request.user!.role === "ADMIN" ? ActorType.ADMIN : ActorType.USER,
        ip: request.ip,
        requestId: request.requestId,
        log: request.log,
      });
      return reply.code(201).send(reservation);
    },
  );

  app.get(
    "/api/me/reservations",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = reservationsQuerySchema.parse(request.query);
      return reservationService.listReservations(query, request.user!.sub);
    },
  );

  app.delete(
    "/api/reservations/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      return reservationService.cancel({
        reservationId: id,
        requesterId: request.user!.sub,
        isAdmin: request.user!.role === "ADMIN",
        ip: request.ip,
        requestId: request.requestId,
        log: request.log,
      });
    },
  );

  app.get(
    "/api/me/activity-logs",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = activityLogsQuerySchema.parse(request.query);
      return activityLogService.list(query, request.user!.sub);
    },
  );
};
