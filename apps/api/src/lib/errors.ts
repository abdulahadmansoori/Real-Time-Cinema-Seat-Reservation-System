import { ERROR_CODES } from "@cinema/shared";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function seatsUnavailable(seatIds: string[]) {
  return new AppError(
    409,
    ERROR_CODES.SEATS_UNAVAILABLE,
    "One or more seats are no longer available",
    { seatIds },
  );
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, ERROR_CODES.UNAUTHORIZED, message);
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, ERROR_CODES.FORBIDDEN, message);
}

export function notFound(message = "Not found") {
  return new AppError(404, ERROR_CODES.NOT_FOUND, message);
}
