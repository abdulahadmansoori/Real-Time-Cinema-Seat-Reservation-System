import type { FastifyInstance } from "fastify";
import type { SeatDto } from "@cinema/shared";
import { SOCKET_EVENTS } from "@cinema/shared";
import { isRedisAvailable } from "./redis";

let appRef: FastifyInstance | null = null;

export function setSocketApp(app: FastifyInstance) {
  appRef = app;
}

export function emitSeatsUpdated(seats: SeatDto[]) {
  if (!appRef) return;
  try {
    appRef.io.emit(SOCKET_EVENTS.SEATS_UPDATED, { seats });
    if (!isRedisAvailable()) {
      appRef.log.warn(
        "Redis unavailable: seats:updated emitted locally only (cross-instance fan-out may lag)",
      );
    }
  } catch (err) {
    appRef.log.warn({ err }, "Failed to emit seats:updated");
  }
}
