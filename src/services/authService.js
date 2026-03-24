"use strict";

import crypto from "crypto";
import User from "../models/User.js";
import { generateTokens, verifyRefreshToken } from "../middleware/auth.js";
import { emailService } from "./emailService.js";
import { cache } from "../config/redis.js";

export const authService = {
  // ==== Register ====================================
  async register({ username, email, password, dateOfBirth, geo }) {
    const exists = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (exists) {
      const field = exists.email === email.toLowerCase() ? "Email" : "Username";
      throw Object.assign(new Error(`${field} already taken`), {
        statusCode: 409,
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      ...(geo && {
        country: geo.country,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
      }),
    });

    const tokens = generateTokens({ id: user._id, role: user.role });

    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    // ✅ Optional email (non-blocking)
    emailService
      .sendWelcome({ email: user.email, username: user.username })
      .catch(() => {});

    return { user: user.toSafeObject(), ...tokens };
  },

  // ==== Login ====================================
  async login({ email, password, geo }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +refreshToken",
    );

    if (!user || !user.password) {
      throw Object.assign(new Error("Invalid email or password"), {
        statusCode: 401,
      });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      throw Object.assign(new Error("Invalid email or password"), {
        statusCode: 401,
      });
    }

    if (!user.isActive) {
      throw Object.assign(new Error("Account suspended"), {
        statusCode: 403,
      });
    }

    const tokens = generateTokens({ id: user._id, role: user.role });

    user.refreshToken = tokens.refreshToken;
    user.lastSeen = new Date();

    if (geo?.country) {
      user.country = geo.country;
      user.city = geo.city;
    }

    await user.save({ validateBeforeSave: false });

    return { user: user.toSafeObject(), ...tokens };
  },

  // ==== Google OAuth ====================================
  async googleAuth({ googleId, email, username, avatar, geo }) {
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        username: username ?? email.split("@")[0],
        avatar,
        isEmailVerified: true,
        ...(geo && {
          country: geo.country,
          city: geo.city,
        }),
      });

      emailService
        .sendWelcome({ email: user.email, username: user.username })
        .catch(() => {});
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (avatar && !user.avatar) user.avatar = avatar;
      user.lastSeen = new Date();
    }

    const tokens = generateTokens({ id: user._id, role: user.role });

    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user: user.toSafeObject(), ...tokens };
  },

  // ==== Refresh token ====================================
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw Object.assign(new Error("Refresh token required"), {
        statusCode: 401,
      });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw Object.assign(new Error("Invalid or expired refresh token"), {
        statusCode: 401,
      });
    }

    const user = await User.findById(payload.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      throw Object.assign(
        new Error("Refresh token reuse detected — please sign in again"),
        { statusCode: 401 },
      );
    }

    const tokens = generateTokens({ id: user._id, role: user.role });

    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return tokens;
  },

  // ==== Logout ====================================
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    await cache.del(`session:${userId}`);
  },

  // ==== Forgot password ====================================
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordReset({
      email: user.email,
      username: user.username,
      resetToken: token,
    });
  },

  // ==== Reset password =====================================
  async resetPassword({ token, newPassword }) {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      throw Object.assign(new Error("Invalid or expired reset token"), {
        statusCode: 400,
      });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;

    await user.save();
  },

  // ==== Get current user ====================================
  async getMe(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw Object.assign(new Error("User not found"), {
        statusCode: 404,
      });
    }

    return user.toSafeObject();
  },
};
