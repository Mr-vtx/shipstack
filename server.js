"use strict";

import { buildApp } from "./src/app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = parseInt(process.env.PORT ?? "8000");
const HOST = "0.0.0.0";

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`fastify-production-starter API running on http://${HOST}:${PORT}`);
    app.log.info(`Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────
process.on("SIGTERM", async () => {
  const app = await buildApp();
  await app.close();
  process.exit(0);
});

start();
