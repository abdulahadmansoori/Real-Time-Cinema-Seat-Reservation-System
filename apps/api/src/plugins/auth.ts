import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { forbidden, unauthorized } from "../lib/errors";

const authPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fjwt, { secret: env.JWT_SECRET });

  app.decorate("authenticate", async (request) => {
    try {
      const payload = await request.jwtVerify<{
        sub: string;
        email: string;
        role: Role;
      }>();
      request.user = payload;
    } catch {
      throw unauthorized();
    }
  });

  app.decorate("requireRole", (role: Role) => {
    return async (request) => {
      await app.authenticate(request, null as never);
      if (!request.user || request.user.role !== role) {
        if (role === Role.ADMIN && request.user?.role !== Role.ADMIN) {
          throw forbidden("Admin role required");
        }
        throw forbidden();
      }
    };
  });
};

export default fp(authPlugin);
