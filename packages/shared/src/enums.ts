export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const SeatStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
} as const;
export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus];

export const ReservationSource = {
  FRONTEND: "FRONTEND",
  PARTNER: "PARTNER",
} as const;
export type ReservationSource =
  (typeof ReservationSource)[keyof typeof ReservationSource];

export const ReservationStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;
export type ReservationStatus =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const ActorType = {
  USER: "USER",
  ADMIN: "ADMIN",
  PARTNER: "PARTNER",
  SYSTEM: "SYSTEM",
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

export const ActivityAction = {
  RESERVATION_CREATED: "RESERVATION_CREATED",
  RESERVATION_CANCELLED: "RESERVATION_CANCELLED",
  RESERVATION_EXPIRED: "RESERVATION_EXPIRED",
  RESERVATION_FAILED: "RESERVATION_FAILED",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  SIMULATION_STARTED: "SIMULATION_STARTED",
  SIMULATION_COMPLETED: "SIMULATION_COMPLETED",
  SEATS_RESET: "SEATS_RESET",
  USER_REGISTERED: "USER_REGISTERED",
} as const;
export type ActivityAction =
  (typeof ActivityAction)[keyof typeof ActivityAction];
