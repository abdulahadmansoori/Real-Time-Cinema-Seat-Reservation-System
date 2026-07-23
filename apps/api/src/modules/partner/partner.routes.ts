import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  ActorType,
  ReservationSource,
  reserveSchema,
} from "@cinema/shared";
import { env } from "../../config/env";
import { unauthorized } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { reservationService } from "../reservations/reservation.service";

const partnerReserveSchema = reserveSchema.extend({
  userId: z.string().optional(),
});

export const partnerRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/v1/partner/reservations", async (request, reply) => {
    const apiKey = request.headers["x-api-key"];
    if (apiKey !== env.PARTNER_API_KEY) {
      throw unauthorized("Invalid partner API key");
    }

    const parsed = partnerReserveSchema.parse(request.body);

    let userId = parsed.userId;
    if (!userId) {
      const partnerUser = await prisma.user.upsert({
        where: { email: "partner@cinema.local" },
        update: {},
        create: {
          email: "partner@cinema.local",
          passwordHash: "!",
          role: "USER",
        },
      });
      userId = partnerUser.id;
    }

    const reservation = await reservationService.reserve({
      userId,
      seatIds: parsed.seatIds,
      source: ReservationSource.PARTNER,
      actorType: ActorType.PARTNER,
      ip: request.ip,
      requestId: request.requestId,
      log: request.log,
    });
    return reply.code(201).send(reservation);
  });
};
