import type {
  ActivityAction,
  ActorType,
  ReservationSource,
  ReservationStatus,
  Role,
  SeatStatus,
} from "./enums";
import type { Paginated } from "./pagination";

export type SeatDto = {
  id: string;
  label: string;
  status: SeatStatus;
  updatedAt: string;
};

export type ReservationDto = {
  id: string;
  userId: string;
  userEmail?: string;
  source: ReservationSource;
  status: ReservationStatus;
  seatIds: string[];
  seatLabels: string[];
  createdAt: string;
  expiresAt: string;
};

export type ActivityLogDto = {
  id: string;
  actorId: string | null;
  actorType: ActorType;
  action: ActivityAction | string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export type UserDto = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: UserDto;
};

export type SeatsUpdatedPayload = {
  seats: SeatDto[];
};

export type PaginatedSeats = Paginated<SeatDto>;
export type PaginatedReservations = Paginated<ReservationDto>;
export type PaginatedActivityLogs = Paginated<ActivityLogDto>;
export type PaginatedUsers = Paginated<UserDto>;

export type SimulationResult = {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  uniqueSeatsReserved: number;
  duplicateSeatViolations: number;
  frontendSuccess: number;
  partnerSuccess: number;
};

export type AdminMetrics = {
  available: number;
  reserved: number;
  total: number;
  occupancyPercent: number;
  reservationsToday: number;
  failedBookingsToday: number;
  activeReservations: number;
  usersCount: number;
  series: Array<{
    day: string;
    label: string;
    bookings: number;
    failures: number;
  }>;
  hotSeats: Array<{ label: string; count: number }>;
  topCustomers: Array<{ email: string; count: number }>;
};
