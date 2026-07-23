import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./config/env";
import { AppError } from "./lib/errors";
import requestIdPlugin from "./plugins/request-id";
import authPlugin from "./plugins/auth";
import { authRoutes } from "./modules/auth/auth.routes";
import { seatsRoutes } from "./modules/seats/seats.routes";
import { reservationRoutes } from "./modules/reservations/reservation.routes";
import { partnerRoutes } from "./modules/partner/partner.routes";
import { adminRoutes } from "./modules/admin/admin.routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      redact: ["req.headers.authorization", "password", "passwordHash"],
    },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });
  await app.register(requestIdPlugin);
  await app.register(authPlugin);

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.flatten(),
        requestId: request.requestId,
      });
    }
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: request.requestId,
      });
    }
    const fastifyErr = err as { code?: string; statusCode?: number; message: string };
    if (fastifyErr.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
      return reply.code(400).send({
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
        requestId: request.requestId,
      });
    }
    request.log.error({ err }, "unhandled error");
    return reply.code(500).send({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId: request.requestId,
    });
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(seatsRoutes);
  await app.register(reservationRoutes);
  await app.register(partnerRoutes);
  await app.register(adminRoutes);

  return app;
}
