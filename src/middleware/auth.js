"use strict";

import jwt from "jsonwebtoken";

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Invalid or expired token — please sign in again",
    });
  }
}

export async function optionalAuth(request) {
  try {
    await request.jwtVerify();
  } catch {
  }
}

export async function adminOnly(request, reply) {
  try {
    await request.jwtVerify();
    if (request.user?.role !== "admin") {
      return reply.code(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Admin access required",
      });
    }
  } catch {
    reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Please sign in",
    });
  }
}

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES ?? "30d",
  });

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}
