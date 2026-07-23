import { buildApp } from "./app";
import { env } from "./config/env";
import { attachSocketIO, closeSocketResources } from "./plugins/socket";
import { startExpirationWorker } from "./workers/expiration.worker";
import type { Server } from "socket.io";

async function main() {
  const app = await buildApp();
  let stopExpire: () => void = () => undefined;
  let io: Server | undefined;

  app.addHook("onClose", async () => {
    stopExpire();
    await closeSocketResources(io);
  });

  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
  io = await attachSocketIO(app);
  stopExpire = startExpirationWorker(app.log);

  app.log.info(`API listening on :${env.API_PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
