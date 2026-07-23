import { z } from "zod";
import { paginationQuerySchema } from "./pagination";
import {
  ActivityAction,
  ActorType,
  ReservationSource,
  ReservationStatus,
  Role,
  SeatStatus,
} from "./enums";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const reserveSchema = z.object({
  seatIds: z.array(z.string().min(1)).min(1).max(50),
});

export const seatsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(SeatStatus).optional(),
  q: z.string().optional(),
  row: z.string().optional(),
  sortBy: z.enum(["label", "status", "updatedAt"]).default("label"),
});

export const reservationsQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  source: z.nativeEnum(ReservationSource).optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  seatId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
  sortBy: z.enum(["createdAt", "expiresAt", "id"]).default("createdAt"),
});

export const activityLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().optional(),
  actorId: z.string().optional(),
  actorType: z.nativeEnum(ActorType).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
  sortBy: z.enum(["createdAt", "action"]).default("createdAt"),
});

export const usersQuerySchema = paginationQuerySchema.extend({
  role: z.nativeEnum(Role).optional(),
  q: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "email", "role"]).default("createdAt"),
});

export const simulateSchema = z.object({
  concurrentUsers: z.number().int().min(1).max(500).default(100),
  seatPoolSize: z.number().int().min(1).max(50).default(5),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ReserveInput = z.infer<typeof reserveSchema>;
