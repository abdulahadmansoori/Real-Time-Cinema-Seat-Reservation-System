import { reservationService } from "../modules/reservations/reservation.service";
import { tryAcquireLock, isRedisAvailable } from "../lib/redis";

const INTERVAL_MS = 15_000;
const LOCK_KEY = "cinema:expire-lock";
const LOCK_TTL_MS = 14_000;

export function startExpirationWorker(log: {
  info: (obj: object | string, msg?: string) => void;
  warn: (obj: object | string, msg?: string) => void;
}) {
  const tick = async () => {
    try {
      if (isRedisAvailable()) {
        const locked = await tryAcquireLock(LOCK_KEY, LOCK_TTL_MS);
        if (!locked) return;
      }
      // If Redis down: best-effort expire; DB transaction is idempotent
      const expired = await reservationService.expireDue();
      if (expired > 0) {
        log.info({ expired }, "expired reservations");
      }
    } catch (err) {
      log.warn({ err }, "expiration worker error");
    }
  };

  const handle = setInterval(tick, INTERVAL_MS);
  void tick();
  return () => clearInterval(handle);
}
