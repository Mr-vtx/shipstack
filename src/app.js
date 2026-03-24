"use strict";

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";

import { connectDB } from "./config/dbConfig.js";
import { connectRedis } from "./config/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss" },
            }
          : undefined,
      level: process.env.NODE_ENV === "development" ? "debug" : "info",
    },
    trustProxy: true, // needed for GeoIP + rate limit behind proxy
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, 
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = process.env.ALLOWED_ORIGINS?.split(",") || [];

      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX ?? "100"),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW ?? "60000"),
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Slow down — you're sending too many requests",
    }),
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, 
    },
  });

  await connectDB();
  await connectRedis();

app.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
});

app.get("/health", async () => {
  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    app: process.env.APP_NAME,
    env: process.env.NODE_ENV,
    services: {
      db: "connected",
      redis: "connected",
    },
  };
});

  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(userRoutes, { prefix: "/api/v1/user" });
  app.register(adminRoutes, { prefix: "/api/v1/admin" });

  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      statusCode: 404,
      error: "Not Found",
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}
