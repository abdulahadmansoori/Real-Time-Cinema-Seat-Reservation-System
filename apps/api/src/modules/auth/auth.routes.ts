import type { FastifyPluginAsync } from "fastify";
import { loginSchema, registerSchema } from "@cinema/shared";
import { authService } from "./auth.service";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const user = await authService.register(
      body.email,
      body.password,
      request.ip,
    );
    const token = await app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return reply.code(201).send({ token, user });
  });

  app.post("/api/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await authService.login(
      app,
      body.email,
      body.password,
      request.ip,
    );
    return reply.send(result);
  });

  app.get(
    "/api/auth/me",
    { preHandler: [app.authenticate] },
    async (request) => {
      return {
        id: request.user!.sub,
        email: request.user!.email,
        role: request.user!.role,
      };
    },
  );
};
