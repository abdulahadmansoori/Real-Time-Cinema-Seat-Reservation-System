import {
  ActivityAction,
  ActorType,
  type ActivityLogDto,
  activityLogsQuerySchema,
} from "@cinema/shared";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { paginate } from "../../lib/pagination";

type LogInput = {
  actorId?: string | null;
  actorType: (typeof ActorType)[keyof typeof ActorType];
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

function toDto(row: {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Prisma.JsonValue;
  ip: string | null;
  createdAt: Date;
}): ActivityLogDto {
  return {
    id: row.id,
    actorId: row.actorId,
    actorType: row.actorType as ActivityLogDto["actorType"],
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    ip: row.ip,
    createdAt: row.createdAt.toISOString(),
  };
}

export class ActivityLogService {
  async log(input: LogInput) {
    return prisma.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorType: input.actorType,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata:
          input.metadata === null || input.metadata === undefined
            ? undefined
            : (input.metadata as Prisma.InputJsonValue),
        ip: input.ip ?? null,
      },
    });
  }

  async list(
    query: z.infer<typeof activityLogsQuerySchema>,
    forceActorId?: string,
  ) {
    const where: Prisma.ActivityLogWhereInput = {};
    if (forceActorId) where.actorId = forceActorId;
    else if (query.actorId) where.actorId = query.actorId;

    if (query.actorType) where.actorType = query.actorType;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) {
      const actions = query.action.split(",").map((a) => a.trim());
      where.action = actions.length > 1 ? { in: actions } : actions[0];
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.q) {
      where.OR = [
        { entityId: { contains: query.q, mode: "insensitive" } },
        { action: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const orderBy =
      query.sortBy === "action"
        ? { action: query.sortOrder }
        : { createdAt: query.sortOrder };

    const result = await paginate({
      page: query.page,
      pageSize: query.pageSize,
      findMany: ({ skip, take }) =>
        prisma.activityLog.findMany({ where, orderBy, skip, take }),
      count: () => prisma.activityLog.count({ where }),
    });

    return {
      data: result.data.map(toDto),
      meta: result.meta,
    };
  }
}

export const activityLogService = new ActivityLogService();
export { ActivityAction, ActorType };
