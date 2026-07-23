import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { ActorType, ActivityAction } from "@cinema/shared";
import { prisma } from "../../lib/prisma";
import { AppError, unauthorized } from "../../lib/errors";
import { activityLogService } from "../activity/activity.service";

export class AuthService {
  async register(
    email: string,
    password: string,
    ip?: string | null,
  ) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "CONFLICT", "Email already registered");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: Role.USER },
    });
    await activityLogService.log({
      actorId: user.id,
      actorType: ActorType.USER,
      action: ActivityAction.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      ip,
    });
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(
    app: FastifyInstance,
    email: string,
    password: string,
    ip?: string | null,
  ) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await activityLogService.log({
        actorType: ActorType.SYSTEM,
        action: ActivityAction.LOGIN_FAILED,
        metadata: { email },
        ip,
      });
      throw unauthorized("Invalid email or password");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await activityLogService.log({
        actorId: user.id,
        actorType: user.role === Role.ADMIN ? ActorType.ADMIN : ActorType.USER,
        action: ActivityAction.LOGIN_FAILED,
        entityType: "User",
        entityId: user.id,
        ip,
      });
      throw unauthorized("Invalid email or password");
    }

    const token = await app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await activityLogService.log({
      actorId: user.id,
      actorType: user.role === Role.ADMIN ? ActorType.ADMIN : ActorType.USER,
      action: ActivityAction.LOGIN_SUCCESS,
      entityType: "User",
      entityId: user.id,
      ip,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}

export const authService = new AuthService();
