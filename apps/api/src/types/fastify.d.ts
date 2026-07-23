import "fastify";
import type { Role } from "@prisma/client";
import type { Server as SocketServer } from "socket.io";

declare module "fastify" {
  interface FastifyInstance {
    io: SocketServer;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    requireRole: (
      role: Role,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    requestId: string;
    user?: {
      sub: string;
      email: string;
      role: Role;
    };
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role: Role;
    };
    user: {
      sub: string;
      email: string;
      role: Role;
    };
  }
}
