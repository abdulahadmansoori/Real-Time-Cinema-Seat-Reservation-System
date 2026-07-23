export const SOCKET_EVENTS = {
  SEATS_UPDATED: "seats:updated",
} as const;

export const ERROR_CODES = {
  SEATS_UNAVAILABLE: "SEATS_UNAVAILABLE",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
} as const;

export const SEAT_ROWS = ["A", "B", "C", "D", "E"] as const;
export const SEATS_PER_ROW = 10;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
