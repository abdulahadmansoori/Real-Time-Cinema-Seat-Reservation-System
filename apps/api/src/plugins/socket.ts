import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { connectRedis, getRedis, isRedisAvailable } from "../lib/redis";
import { setSocketApp } from "../lib/socket-emit";

export async function attachSocketIO(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
  });

  Object.assign(app, { io });
  setSocketApp(app);

  const redis = await connectRedis();
  if (redis && isRedisAvailable()) {
    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();
      if (pubClient.status === "wait") await pubClient.connect();
      if (subClient.status === "wait") await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      app.log.info("Socket.IO Redis adapter attached");
    } catch (err) {
      app.log.warn(
        { err },
        "Socket.IO running without Redis adapter (degraded mode)",
      );
    }
  } else {
    app.log.warn("Redis unavailable — Socket.IO local-only (degraded mode)");
  }

  io.on("connection", (socket) => {
    app.log.debug({ socketId: socket.id }, "socket connected");
  });

  return io;
}

export async function closeSocketResources(io?: Server) {
  try {
    await io?.close();
  } catch {
    /* ignore */
  }
  try {
    getRedis()?.disconnect();
  } catch {
    /* ignore */
  }
}
