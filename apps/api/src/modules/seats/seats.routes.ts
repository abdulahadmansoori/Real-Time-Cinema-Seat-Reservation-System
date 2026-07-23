import type { FastifyPluginAsync } from "fastify";
import { seatsQuerySchema } from "@cinema/shared";
import { reservationService } from "../reservations/reservation.service";

export const seatsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/seats", async (request) => {
    const query = seatsQuerySchema.parse(request.query);
    return reservationService.listSeats(query);
  });

  app.get("/api/seats/all", async () => {
    const seats = await reservationService.getAllSeats();
    return { data: seats };
  });

  app.get("/api/seats/availability", async () => {
    return reservationService.availability();
  });
};
